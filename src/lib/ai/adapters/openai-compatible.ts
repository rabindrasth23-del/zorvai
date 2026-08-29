/**
 * AI Provider Engine — OpenAI-Compatible Adapter
 *
 * Shared adapter for DeepSeek, Qwen, GLM, and Kimi.
 * All use the OpenAI wire format with custom baseURL and API key.
 */

import OpenAI from 'openai';
import type { ProviderConfig } from '../config';
import type { AdapterRequest, AdapterResponse } from './anthropic';

// Cache one OpenAI client instance per provider to reuse connections
const clientCache = new Map<string, OpenAI>();

function getClient(provider: ProviderConfig): OpenAI {
  const existing = clientCache.get(provider.id);
  if (existing) return existing;

  const apiKey = process.env[provider.apiKeyEnv];
  if (!apiKey) {
    throw new Error(`${provider.apiKeyEnv} is not set for provider ${provider.name}`);
  }

  if (!provider.baseUrl) {
    throw new Error(`baseUrl is not configured for provider ${provider.name}`);
  }

  const client = new OpenAI({
    apiKey,
    baseURL: provider.baseUrl,
  });

  clientCache.set(provider.id, client);
  return client;
}

/**
 * Call an OpenAI-compatible provider (via OpenRouter).
 * Returns the raw text content from the provider's response.
 * Supports multimodal content (images/PDFs) when attachment is provided.
 */
export async function callOpenAICompatible(
  request: AdapterRequest
): Promise<AdapterResponse> {
  const client = getClient(request.provider);
  const start = Date.now();

  // Build user message content — plain string or multimodal array
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let userContent: any = request.userMessage;

  if (request.attachment) {
    const { base64, mimeType, filename } = request.attachment;
    const isImage = mimeType.startsWith('image/');

    if (isImage) {
      // Images: use image_url content part with base64 data URL
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
      // PDFs/documents: use OpenRouter's file content part
      userContent = [
        { type: 'text', text: request.userMessage },
        {
          type: 'file',
          file: {
            filename,
            file_data: `data:${mimeType};base64,${base64}`,
          },
        },
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
