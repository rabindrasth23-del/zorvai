/**
 * AI Provider Engine — Main Entrypoint
 *
 * runAICall(callType, payload) is the ONLY function API routes
 * should use to make AI calls. It:
 * 1. Builds the prompt from the call type + payload
 * 2. Iterates the provider chain for that call type
 * 3. Applies circuit breaker logic (skip providers with recent failures)
 * 4. Validates the response against the Zod schema
 * 5. Logs every attempt to ai_provider_logs
 * 6. Falls through to the next provider on failure
 *
 * No route should ever call a provider SDK directly.
 */

import type { CallType, ProviderId } from './config';
import {
  PROVIDERS,
  PROVIDER_CHAINS,
  CIRCUIT_BREAKER,
} from './config';
import { RESPONSE_SCHEMAS } from './schema';
import { getSystemPrompt, getUserMessage } from './prompts';
import { callAnthropic } from './adapters/anthropic';
import { callOpenAICompatible } from './adapters/openai-compatible';
import { createAdminClient } from '../supabase/admin';

// ---------------------------------------------------------------------------
// Circuit breaker state (in-memory, per process)
// ---------------------------------------------------------------------------

interface CircuitState {
  consecutiveFailures: number;
  lastFailureAt: number;
}

const circuitStates = new Map<ProviderId, CircuitState>();

function isCircuitOpen(providerId: ProviderId): boolean {
  const state = circuitStates.get(providerId);
  if (!state) return false;

  if (state.consecutiveFailures >= CIRCUIT_BREAKER.failureThreshold) {
    const elapsed = Date.now() - state.lastFailureAt;
    if (elapsed < CIRCUIT_BREAKER.cooldownMs) {
      return true; // Circuit is open — skip this provider
    }
    // Cooldown expired — reset and allow retry
    circuitStates.delete(providerId);
    return false;
  }

  return false;
}

function recordFailure(providerId: ProviderId): void {
  const state = circuitStates.get(providerId) ?? {
    consecutiveFailures: 0,
    lastFailureAt: 0,
  };
  state.consecutiveFailures += 1;
  state.lastFailureAt = Date.now();
  circuitStates.set(providerId, state);
}

function recordSuccess(providerId: ProviderId): void {
  circuitStates.delete(providerId);
}

// ---------------------------------------------------------------------------
// Provider dispatch
// ---------------------------------------------------------------------------

function callProvider(
  providerId: ProviderId,
  systemPrompt: string,
  userMessage: string,
  signal: AbortSignal,
  attachment?: { base64: string; mimeType: string; filename: string }
) {
  const provider = PROVIDERS[providerId];
  return callOpenAICompatible({ systemPrompt, userMessage, provider, signal, attachment });
}

// ---------------------------------------------------------------------------
// JSON extraction from AI response
// ---------------------------------------------------------------------------

/**
 * Extract JSON from a response that might contain markdown code fences
 * or other wrapping around the JSON.
 */
function extractJSON(raw: string): string {
  // Try to extract from ```json ... ``` blocks
  const jsonBlockMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (jsonBlockMatch) {
    return jsonBlockMatch[1].trim();
  }

  // Try to find raw JSON object
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return raw.slice(firstBrace, lastBrace + 1);
  }

  // Return as-is and let JSON.parse fail with a clear error
  return raw.trim();
}

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

async function logAttempt(
  callType: CallType,
  provider: string,
  latencyMs: number | null,
  success: boolean,
  error?: string
): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from('ai_provider_logs').insert({
      call_type: callType,
      provider,
      latency_ms: latencyMs,
      success,
      error: error ?? null,
    });
  } catch (logError) {
    // Logging failures should never break the AI call itself
    console.error('[AI Engine] Failed to log to ai_provider_logs:', logError);
  }
}

// ---------------------------------------------------------------------------
// Main entrypoint
// ---------------------------------------------------------------------------

export interface AICallResult<T = unknown> {
  data: T;
  provider: ProviderId;
  latencyMs: number;
}

/**
 * Run an AI call with automatic provider fallback, circuit breaking,
 * Zod validation, and logging.
 *
 * @param callType - One of the 7 call types (plan, teach, recall, challenge, feedback, chatbot, checkin)
 * @param payload - Call-type-specific data (student context, topic, etc.)
 * @returns Validated, typed response data + metadata
 * @throws Error if all providers in the chain fail
 */
export async function runAICall<T = unknown>(
  callType: CallType,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: Record<string, any>
): Promise<AICallResult<T>> {
  const chain = PROVIDER_CHAINS[callType];
  const schema = RESPONSE_SCHEMAS[callType];
  const systemPrompt = getSystemPrompt(callType, payload);
  const userMessage = getUserMessage(callType, payload);

  const errors: Array<{ provider: ProviderId; error: string }> = [];

  for (const providerId of chain) {
    // Check circuit breaker
    if (isCircuitOpen(providerId)) {
      const msg = `Circuit open — skipping ${providerId} (cooldown active)`;
      errors.push({ provider: providerId, error: msg });
      console.warn(`[AI Engine] ${msg}`);
      continue;
    }

    // Check if API key is configured
    const provider = PROVIDERS[providerId];
    const apiKey = process.env[provider.apiKeyEnv];
    if (!apiKey) {
      const msg = `${provider.apiKeyEnv} not set — skipping ${providerId}`;
      errors.push({ provider: providerId, error: msg });
      continue;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, provider.timeoutMs);

      // Make the AI call with timeout signal
      const response = await callProvider(providerId, systemPrompt, userMessage, controller.signal, payload.attachment);
      clearTimeout(timeoutId);
      
      // Parse JSON from response
      const jsonStr = extractJSON(response.content);
      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        throw new Error(
          `Invalid JSON from ${providerId}: ${jsonStr.slice(0, 200)}...`
        );
      }

      // Validate against Zod schema
      const validation = schema.safeParse(parsed);
      if (!validation.success) {
        const zodErrors = JSON.stringify(validation.error.issues ?? validation.error, null, 2);
        throw new Error(
          `Zod validation failed for ${callType} from ${providerId}: ${zodErrors}`
        );
      }

      // Success — log and return
      recordSuccess(providerId);
      await logAttempt(callType, providerId, response.latencyMs, true);

      return {
        data: validation.data as T,
        provider: providerId,
        latencyMs: response.latencyMs,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      errors.push({ provider: providerId, error: errorMsg });
      recordFailure(providerId);
      await logAttempt(callType, providerId, null, false, errorMsg);
      console.error(`[AI Engine] ${providerId} failed for ${callType}:`, errorMsg);
    }
  }

  // All providers failed
  const isCheckin = callType === 'checkin';
  const checkinNote = isCheckin
    ? ' NOTE: Check-in uses a restricted provider chain. If CHECKIN_FALLBACK_PROVIDER is not set, only Claude is available.'
    : '';

  throw new Error(
    `All providers failed for call type "${callType}".${checkinNote}\n` +
    `Errors:\n${errors.map((e) => `  ${e.provider}: ${e.error}`).join('\n')}`
  );
}
