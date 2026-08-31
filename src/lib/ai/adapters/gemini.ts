/**
 * AI Provider Engine — Google Gemini Adapter
 *
 * Calls Google's Gemini API directly using the REST endpoint.
 * No OpenRouter dependency.
 */

import type { ProviderConfig } from '../config';
import type { AdapterResponse } from './anthropic';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export interface GeminiAdapterRequest {
  provider: ProviderConfig;
  systemPrompt: string;
  userMessage: string;
  signal?: AbortSignal;
  attachment?: {
    base64: string;
    mimeType: string;
    filename: string;
  };
}

/**
 * Call Google Gemini API directly.
 * Returns the raw text content from Gemini's response.
 */
export async function callGemini(
  request: GeminiAdapterRequest
): Promise<AdapterResponse> {
  const apiKey = process.env[request.provider.apiKeyEnv];
  if (!apiKey) {
    throw new Error(`${request.provider.apiKeyEnv} is not set`);
  }

  const start = Date.now();
  const model = request.provider.model;
  const url = `${GEMINI_BASE}/models/${model}:generateContent?key=${apiKey}`;

  // Build parts array
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parts: any[] = [{ text: request.userMessage }];

  if (request.attachment) {
    const { base64, mimeType } = request.attachment;
    parts.push({
      inlineData: {
        mimeType,
        data: base64,
      },
    });
  }

  const body = {
    systemInstruction: {
      parts: [{ text: request.systemPrompt }],
    },
    contents: [
      {
        role: 'user',
        parts,
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: request.signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText.slice(0, 300)}`);
  }

  const data = await response.json();
  const latencyMs = Date.now() - start;

  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    throw new Error(`Gemini returned no text content. Response: ${JSON.stringify(data).slice(0, 300)}`);
  }

  return {
    content,
    provider: request.provider.id,
    latencyMs,
  };
}
