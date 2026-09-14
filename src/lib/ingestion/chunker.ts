/**
 * Text Chunker for Material Library
 *
 * Splits extracted document text into overlapping chunks suitable for
 * embedding and RAG retrieval. Uses a sliding window with overlap to
 * preserve context across chunk boundaries.
 */

export interface TextChunk {
  text: string;
  pageRef: string | null;
  chunkIndex: number;
}

interface ChunkerOptions {
  /** Target chunk size in characters (default: 1000) */
  chunkSize?: number;
  /** Overlap between chunks in characters (default: 200) */
  overlap?: number;
  /** Minimum chunk size — don't create tiny trailing chunks (default: 100) */
  minChunkSize?: number;
}

const DEFAULT_OPTIONS: Required<ChunkerOptions> = {
  chunkSize: 1000,
  overlap: 200,
  minChunkSize: 100,
};

/**
 * Split text into overlapping chunks.
 * Tries to split on paragraph/sentence boundaries when possible.
 */
export function chunkText(
  text: string,
  pageRef: string | null = null,
  options: ChunkerOptions = {}
): TextChunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const chunks: TextChunk[] = [];

  if (!text || text.trim().length === 0) return chunks;

  const cleanedText = text.replace(/\r\n/g, '\n').trim();

  if (cleanedText.length <= opts.chunkSize) {
    return [{ text: cleanedText, pageRef, chunkIndex: 0 }];
  }

  let start = 0;
  let chunkIndex = 0;

  while (start < cleanedText.length) {
    let end = Math.min(start + opts.chunkSize, cleanedText.length);

    // If we're not at the end, try to find a good break point
    if (end < cleanedText.length) {
      const breakPoint = findBreakPoint(cleanedText, start, end);
      if (breakPoint > start) {
        end = breakPoint;
      }
    }

    const chunkText = cleanedText.slice(start, end).trim();

    if (chunkText.length >= opts.minChunkSize) {
      chunks.push({
        text: chunkText,
        pageRef,
        chunkIndex,
      });
      chunkIndex++;
    }

    // Move forward by chunkSize - overlap
    const step = end - start - opts.overlap;
    start += Math.max(step, opts.minChunkSize);
  }

  return chunks;
}

/**
 * Find the best break point (paragraph or sentence boundary) within a range.
 */
function findBreakPoint(text: string, start: number, end: number): number {
  // Look back from `end` for a paragraph break (double newline)
  const searchWindow = text.slice(start, end);

  // Priority 1: paragraph break (double newline)
  const lastParagraph = searchWindow.lastIndexOf('\n\n');
  if (lastParagraph > searchWindow.length * 0.3) {
    return start + lastParagraph + 2;
  }

  // Priority 2: single newline
  const lastNewline = searchWindow.lastIndexOf('\n');
  if (lastNewline > searchWindow.length * 0.3) {
    return start + lastNewline + 1;
  }

  // Priority 3: sentence end (. ! ?)
  const sentenceEndRegex = /[.!?]\s/g;
  let lastSentenceEnd = -1;
  let match;
  while ((match = sentenceEndRegex.exec(searchWindow)) !== null) {
    if (match.index > searchWindow.length * 0.3) {
      lastSentenceEnd = match.index;
    }
  }
  if (lastSentenceEnd > 0) {
    return start + lastSentenceEnd + 2;
  }

  // Fallback: just use end
  return end;
}

/**
 * Split a multi-page document into page-aware chunks.
 * Each page's text is chunked separately with page references.
 */
export function chunkPages(
  pages: Array<{ text: string; pageNumber: number }>,
  options: ChunkerOptions = {}
): TextChunk[] {
  const allChunks: TextChunk[] = [];
  let globalIndex = 0;

  for (const page of pages) {
    const pageChunks = chunkText(page.text, `p.${page.pageNumber}`, options);
    for (const chunk of pageChunks) {
      allChunks.push({
        ...chunk,
        chunkIndex: globalIndex++,
      });
    }
  }

  return allChunks;
}
