/**
 * AI Provider Engine — OpenAI Adapter
 *
 * Direct OpenAI API calls. No OpenRouter dependency.
 * Used as a fallback provider when Claude and Gemini are both down.
 */

import OpenAI from 'openai';
import type { ProviderConfig } from '../config';
import type { AdapterRequest, AdapterResponse } from './anthropic';

// Cache one OpenAI client instance to reuse connections
let clientInstance: OpenAI | null = null;

function getClient(provider: ProviderConfig): OpenAI {
  if (clientInstance) return clientInstance;

  const apiKey = process.env[provider.apiKeyEnv];
  if (!apiKey) {
    throw new Error(`${provider.apiKeyEnv} is not set for provider ${provider.name}`);
  }

  clientInstance = new OpenAI({
    apiKey,
    baseURL: provider.baseUrl || 'https://api.openai.com/v1',
  });

  return clientInstance;
}

/**
 * Call OpenAI's API directly.
 * Returns the raw text content from the response.
 * Supports multimodal content (images) when attachment is provided.
 */
export async function callOpenAI(
  request: AdapterRequest
): Promise<AdapterResponse> {
  const client = getClient(request.provider);
  const start = Date.now();

  // Build user message content — plain string or multimodal array
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let userContent: any = request.userMessage;

  if (request.attachment) {
    const { base64, mimeType } = request.attachment;
    const isImage = mimeType.startsWith('image/');

    if (isImage) {
      userContent = [
        { type: 'text', text: request.userMessage },
        {
          type: 'image_url',
          image_url: {
            url: `data:${mimeType};base64,${base64}`,
          },
        },
      ];
    } else {
      // For non-image files, include as text context
      userContent = [
        { type: 'text', text: `${request.userMessage}\n\n[Attached file: ${request.attachment.filename}]` },
      ];
    }
  }

  const response = await client.chat.completions.create({
    model: request.provider.model,
    max_tokens: 4096,
    messages: [
      {
        role: 'system' as const,
        content: request.systemPrompt,
      },
      {
        role: 'user' as const,
        content: userContent,
      },
    ],
  }, { signal: request.signal });

  const latencyMs = Date.now() - start;

  const content = response.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error(`${request.provider.name} returned no content`);
  }

  return {
    content,
    provider: request.provider.id,
    latencyMs,
  };
}
