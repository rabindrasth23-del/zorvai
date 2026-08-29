/**
 * AI Provider Engine — Configuration
 *
 * Per-call-type provider chains, timeouts, and circuit breaker settings.
 * All AI calls route through runAICall() which uses these chains.
 */

// ---------------------------------------------------------------------------
// Provider identifiers
// ---------------------------------------------------------------------------

export type ProviderId = 'claude_opus_5_fast' | 'gemini_3_7_flash' | 'gpt_5_6_luna_pro' | 'checkin_fallback';

export type CallType =
  | 'plan'
  | 'teach'
  | 'teach_chat'
  | 'key_concepts_extract'
  | 'recall'
  | 'challenge'
  | 'feedback'
  | 'chatbot'
  | 'checkin'
  | 'onboarding_transition'
  | 'safety_classifier';

// ---------------------------------------------------------------------------
// Provider configuration
// ---------------------------------------------------------------------------

export interface ProviderConfig {
  id: ProviderId;
  name: string;
  /** Model identifier to pass to the provider */
  model: string;
  /** For OpenAI-compatible providers — the base URL */
  baseUrl?: string;
  /** Environment variable name holding the API key */
  apiKeyEnv: string;
  /** Request timeout in milliseconds */
  timeoutMs: number;
}

export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  claude_opus_5_fast: {
    id: 'claude_opus_5_fast',
    name: 'Claude Opus 5 Fast (OpenRouter)',
    model: 'anthropic/claude-opus-5-fast',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    timeoutMs: 15_000, // Strict 15s timeout
  },
  gemini_3_7_flash: {
    id: 'gemini_3_7_flash',
    name: 'Gemini 3.7 Flash (OpenRouter)',
    model: 'google/gemini-3.7-flash',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    timeoutMs: 15_000,
  },
  gpt_5_6_luna_pro: {
    id: 'gpt_5_6_luna_pro',
    name: 'GPT-5.6 Luna Pro (OpenRouter)',
    model: 'openai/gpt-5.6-luna-pro',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    timeoutMs: 15_000,
  },
  checkin_fallback: {
    id: 'checkin_fallback',
    name: 'Check-in Fallback',
    model: process.env.CHECKIN_FALLBACK_MODEL || 'anthropic/claude-3-haiku',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    timeoutMs: 10_000,
  },
};

// ---------------------------------------------------------------------------
// Per-call-type provider chains
// ---------------------------------------------------------------------------

/**
 * Standard High-Reliability Chain (for quality-critical phases like Challenge/Feedback)
 * 1. Claude Opus 5 Fast
 * 2. Gemini 3.7 Flash
 * 3. GPT-5.6 Luna Pro
 */
const DEFAULT_CHAIN: ProviderId[] = ['claude_opus_5_fast', 'gemini_3_7_flash', 'gpt_5_6_luna_pro'];

/**
 * Teach Phase Chain
 * Uses GPT-5.6 Luna Pro as primary to balance cost during the highest-volume phase,
 * reserving Opus 5 Fast for evaluation phases.
 */
const TEACH_CHAIN: ProviderId[] = ['gpt_5_6_luna_pro', 'claude_opus_5_fast', 'gemini_3_7_flash'];

/**
 * Check-in chain:
 * Uses Claude Opus 5 Fast first. If it fails, falls back to the configured fallback model.
 */
function getCheckinChain(): ProviderId[] {
  const fallbackEnabled = process.env.CHECKIN_FALLBACK_ENABLED === 'true';
  if (fallbackEnabled) {
    return ['claude_opus_5_fast', 'checkin_fallback'];
  }
  return ['claude_opus_5_fast'];
}

export const PROVIDER_CHAINS: Record<CallType, ProviderId[]> = {
  plan: DEFAULT_CHAIN,
  teach: TEACH_CHAIN,
  teach_chat: TEACH_CHAIN,
  key_concepts_extract: ['gemini_3_7_flash', 'claude_opus_5_fast'],
  recall: DEFAULT_CHAIN,
  challenge: DEFAULT_CHAIN,
  feedback: DEFAULT_CHAIN,
  chatbot: DEFAULT_CHAIN,
  checkin: getCheckinChain(),
  onboarding_transition: ['gemini_3_7_flash', 'claude_opus_5_fast'],
  safety_classifier: ['gemini_3_7_flash', 'claude_opus_5_fast'],
};

// ---------------------------------------------------------------------------
// Circuit breaker configuration
// ---------------------------------------------------------------------------

export interface CircuitBreakerConfig {
  /** Number of consecutive failures before the circuit opens */
  failureThreshold: number;
  /** Cooldown window in milliseconds before retrying the provider */
  cooldownMs: number;
}

export const CIRCUIT_BREAKER: CircuitBreakerConfig = {
  failureThreshold: 3,
  cooldownMs: 60_000, // 60 seconds
};
