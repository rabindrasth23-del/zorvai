/**
 * AI Provider Engine — Anthropic (Claude) Adapter
 *
 * Wraps the @anthropic-ai/sdk. Maps internal callType + payload
 * into Claude's message format. Returns raw text content for
 * the engine to parse and validate.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { ProviderConfig } from '../config';

let clientInstance: Anthropic | null = null;

function getClient(): Anthropic {
  if (!clientInstance) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }
    clientInstance = new Anthropic({ apiKey });
  }
  return clientInstance;
}

export interface AdapterRequest {
  provider: ProviderConfig;
  systemPrompt: string;
  userMessage: string;
  /** Optional file attachment for multimodal calls (images/PDFs) */
  attachment?: {
    base64: string;      // Base64-encoded file content
    mimeType: string;    // e.g. 'image/jpeg', 'application/pdf'
    filename: string;    // Original filename
  };
  signal?: AbortSignal;
}

export interface AdapterResponse {
  content: string;
  provider: string;
  latencyMs: number;
}

/**
 * Call Claude via the Anthropic SDK.
 * Returns the raw text content from Claude's response.
 */
export async function callAnthropic(
  request: AdapterRequest
): Promise<AdapterResponse> {
  const client = getClient();
  const start = Date.now();

  const response = await client.messages.create({
    model: request.provider.model,
    max_tokens: 4096,
    system: request.systemPrompt,
    messages: [
      {
        role: 'user',
        content: request.userMessage,
      },
    ],
  });

  const latencyMs = Date.now() - start;

  // Extract text from the response content blocks
  const textBlocks = response.content.filter(
    (block): block is Anthropic.TextBlock => block.type === 'text'
  );

  if (textBlocks.length === 0) {
    throw new Error('Claude returned no text content');
  }

  return {
    content: textBlocks.map((b) => b.text).join('\n'),
    provider: 'claude',
    latencyMs,
  };
}
