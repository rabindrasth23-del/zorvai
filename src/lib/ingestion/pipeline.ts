/**
 * Material Ingestion Pipeline
 *
 * Async pipeline: Upload → Extract text → Chunk → Embed → Store in pgvector
 * Runs independently of the request/response cycle so uploads don't block the UI.
 *
 * Uses pdf-parse for text-based PDFs. For scanned/handwritten notes,
 * a cloud OCR API would be needed (Phase 2 upgrade).
 */

import { createClient } from '@supabase/supabase-js';
import { chunkText, chunkPages, type TextChunk } from './chunker';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IngestionResult {
  materialId: string;
  status: 'ready' | 'failed';
  chunkCount: number;
  topicCount: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// Supabase admin client (service role for ingestion)
// ---------------------------------------------------------------------------

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey);
}

// ---------------------------------------------------------------------------
// Text Extraction
// ---------------------------------------------------------------------------

async function extractTextFromPdf(buffer: Buffer): Promise<Array<{ text: string; pageNumber: number }>> {
  // Dynamic import to avoid bundling issues — pdf-parse is CJS
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse') as (buffer: Buffer) => Promise<{ text: string; numpages: number }>;
  const data = await pdfParse(buffer);

  // pdf-parse gives us the full text; we split by form feed or estimate pages
  // For now, treat the whole document as page-aware by splitting on form feeds
  const rawText = data.text || '';
  const pageTexts = rawText.split('\f').filter((t: string) => t.trim().length > 0);

  return pageTexts.map((text: string, i: number) => ({
    text: text.trim(),
    pageNumber: i + 1,
  }));
}

function extractTextFromPlainText(text: string): Array<{ text: string; pageNumber: number }> {
  // Plain text is just one "page"
  return [{ text, pageNumber: 1 }];
}

// ---------------------------------------------------------------------------
// Embedding (using OpenAI embeddings API)
// ---------------------------------------------------------------------------

async function embedTexts(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required for embedding generation');
  }

  // Batch in groups of 20 to stay within limits
  const batchSize = 20;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: batch,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Embedding API error: ${response.status} — ${err}`);
    }

    const data = await response.json();
    const embeddings = data.data.map((d: { embedding: number[] }) => d.embedding);
    allEmbeddings.push(...embeddings);
  }

  return allEmbeddings;
}

// ---------------------------------------------------------------------------
// Topic Extraction (using AI)
// ---------------------------------------------------------------------------

async function extractTopics(
  text: string,
  subject: string
): Promise<Array<{ name: string; sourcePages: string[] }>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Fallback: no topics extracted
    return [];
  }

  const truncatedText = text.slice(0, 15000); // Limit context to keep costs low

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: `You are analyzing study material for the subject "${subject}". Extract a structured topic list from this document text.

Document text:
---
${truncatedText}
---

Respond with ONLY valid JSON in this format:
{
  "topics": [
    { "name": "Topic name", "source_pages": ["p.1", "p.2"] }
  ]
}

Rules:
- Extract 5-20 specific, narrow topics suitable for individual study sessions
- Each topic should be concrete enough to teach in 20-30 minutes
- Include source page references where the topic appears
- Order topics from foundational to advanced
- Topic names should be specific (e.g., "Newton's Second Law" not "Physics")`,
          },
        ],
      }),
    });

    if (!response.ok) return [];

    const data = await response.json();
    const content = data.content?.[0]?.text || '';

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]);
    return (parsed.topics || []).map((t: { name: string; source_pages?: string[] }) => ({
      name: t.name,
      sourcePages: t.source_pages || [],
    }));
  } catch {
    console.error('[Ingestion] Topic extraction failed');
    return [];
  }
}

// ---------------------------------------------------------------------------
// Main Pipeline
// ---------------------------------------------------------------------------

export async function runIngestionPipeline(materialId: string): Promise<IngestionResult> {
  const supabase = getAdminClient();

  try {
    // 1. Update status to 'extracting'
    await supabase
      .from('materials')
      .update({ status: 'extracting', updated_at: new Date().toISOString() })
      .eq('id', materialId);

    // 2. Fetch material record
    const { data: material, error: fetchError } = await supabase
      .from('materials')
      .select('*')
      .eq('id', materialId)
      .single();

    if (fetchError || !material) {
      throw new Error(`Material not found: ${materialId}`);
    }

    // 3. Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('materials')
      .download(material.storage_url);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    // 4. Extract text
    let pages: Array<{ text: string; pageNumber: number }>;
    const buffer = Buffer.from(await fileData.arrayBuffer());

    switch (material.type) {
      case 'pdf':
        pages = await extractTextFromPdf(buffer);
        break;
      case 'text':
        pages = extractTextFromPlainText(buffer.toString('utf-8'));
        break;
      case 'image':
        // For images, we'd need OCR — for now, return a placeholder
        // Phase 2: integrate Google Vision or AWS Textract
        pages = [{ text: '[Image content — OCR not yet available]', pageNumber: 1 }];
        break;
      default:
        pages = extractTextFromPlainText(buffer.toString('utf-8'));
    }

    // Update page count
    await supabase
      .from('materials')
      .update({ page_count: pages.length, updated_at: new Date().toISOString() })
      .eq('id', materialId);

    // 5. Chunk text
    const chunks: TextChunk[] = chunkPages(pages);

    if (chunks.length === 0) {
      throw new Error('No text content could be extracted from this file');
    }

    // 6. Generate embeddings
    const embeddings = await embedTexts(chunks.map(c => c.text));

    // 7. Store chunks with embeddings
    const chunkRows = chunks.map((chunk, i) => ({
      material_id: materialId,
      page_ref: chunk.pageRef,
      chunk_index: chunk.chunkIndex,
      text: chunk.text,
      embedding: `[${embeddings[i].join(',')}]`,
    }));

    // Insert in batches of 50
    const batchSize = 50;
    for (let i = 0; i < chunkRows.length; i += batchSize) {
      const batch = chunkRows.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from('material_chunks')
        .insert(batch);

      if (insertError) {
        throw new Error(`Failed to insert chunks: ${insertError.message}`);
      }
    }

    // 8. Extract topics
    const fullText = pages.map(p => p.text).join('\n\n');
    const topics = await extractTopics(fullText, material.subject);

    // 9. Store extracted topics
    if (topics.length > 0) {
      const topicRows = topics.map((t, i) => ({
        material_id: materialId,
        name: t.name,
        source_pages: t.sourcePages,
        sort_order: i,
      }));

      await supabase.from('extracted_topics').insert(topicRows);
    }

    // 10. Update status to 'ready'
    await supabase
      .from('materials')
      .update({ status: 'ready', updated_at: new Date().toISOString() })
      .eq('id', materialId);

    return {
      materialId,
      status: 'ready',
      chunkCount: chunks.length,
      topicCount: topics.length,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Update status to 'failed'
    await supabase
      .from('materials')
      .update({
        status: 'failed',
        error_message: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', materialId);

    return {
      materialId,
      status: 'failed',
      chunkCount: 0,
      topicCount: 0,
      error: errorMessage,
    };
  }
}

// ---------------------------------------------------------------------------
// RAG Retrieval — fetch relevant chunks for a topic
// ---------------------------------------------------------------------------

export async function retrieveRelevantChunks(
  userId: string,
  subject: string,
  topicQuery: string,
  maxChunks: number = 5
): Promise<Array<{ text: string; pageRef: string | null; similarity: number }>> {
  const supabase = getAdminClient();

  try {
    // 1. Get material IDs for this user + subject
    const { data: materials } = await supabase
      .from('materials')
      .select('id')
      .eq('user_id', userId)
      .eq('subject', subject)
      .eq('status', 'ready');

    if (!materials || materials.length === 0) return [];

    const materialIds = materials.map(m => m.id);

    // 2. Embed the query
    const [queryEmbedding] = await embedTexts([topicQuery]);

    // 3. Use the similarity search function
    const { data: chunks, error } = await supabase.rpc('match_material_chunks', {
      query_embedding: `[${queryEmbedding.join(',')}]`,
      match_material_ids: materialIds,
      match_threshold: 0.6,
      match_count: maxChunks,
    });

    if (error || !chunks) return [];

    return chunks.map((c: { text: string; page_ref: string | null; similarity: number }) => ({
      text: c.text,
      pageRef: c.page_ref,
      similarity: c.similarity,
    }));
  } catch (error) {
    console.error('[RAG] Retrieval failed:', error);
    return [];
  }
}
