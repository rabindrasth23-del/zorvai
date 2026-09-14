/**
 * AI Provider Engine — Configuration
 *
 * Direct API providers — NO OpenRouter.
 * Claude (Anthropic) for quality-critical phases.
 * Gemini (Google) for high-volume phases.
 * OpenAI as optional fallback.
 */

// ---------------------------------------------------------------------------
// Provider identifiers
// ---------------------------------------------------------------------------

export type ProviderId = 'claude' | 'gemini' | 'openai';

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
  | 'safety_classifier'
  | 'grounded_teach'
  | 'mock_exam_generate'
  | 'mock_exam_grade'
  | 'snap_solve'
  | 'material_ingest';

// ---------------------------------------------------------------------------
// Provider configuration
// ---------------------------------------------------------------------------

export type ProviderType = 'anthropic' | 'gemini' | 'openai';

export interface ProviderConfig {
  id: ProviderId;
  name: string;
  /** The provider type determines which adapter to use */
  type: ProviderType;
  /** Model identifier to pass to the provider */
  model: string;
  /** For OpenAI — the base URL (not needed for Anthropic/Gemini) */
  baseUrl?: string;
  /** Environment variable name holding the API key */
  apiKeyEnv: string;
  /** Request timeout in milliseconds */
  timeoutMs: number;
}

export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  claude: {
    id: 'claude',
    name: 'Claude (Anthropic Direct)',
    type: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    apiKeyEnv: 'ANTHROPIC_API_KEY',
    timeoutMs: 30_000,
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini (Google AI Direct)',
    type: 'gemini',
    model: 'gemini-2.5-flash',
    apiKeyEnv: 'GEMINI_API_KEY',
    timeoutMs: 30_000,
  },
  openai: {
    id: 'openai',
    name: 'ChatGPT (OpenAI Direct)',
    type: 'openai',
    model: 'gpt-4o-mini',
    baseUrl: 'https://api.openai.com/v1',
    apiKeyEnv: 'OPENAI_API_KEY',
    timeoutMs: 30_000,
  },
};

// ---------------------------------------------------------------------------
// Per-call-type provider chains
// ---------------------------------------------------------------------------

/**
 * Claude-first chain (quality-critical phases)
 * 1. Claude — best reasoning
 * 2. Gemini — fast fallback
 * 3. OpenAI — last resort
 */
const CLAUDE_FIRST: ProviderId[] = ['claude', 'gemini', 'openai'];

/**
 * Gemini-first chain (high-volume, cost-sensitive phases)
 * 1. Gemini — fast and cheap
 * 2. Claude — quality fallback
 * 3. OpenAI — last resort
 */
const GEMINI_FIRST: ProviderId[] = ['gemini', 'claude', 'openai'];

export const PROVIDER_CHAINS: Record<CallType, ProviderId[]> = {
  // Claude for quality-critical evaluation phases
  plan: CLAUDE_FIRST,
  recall: CLAUDE_FIRST,
  challenge: CLAUDE_FIRST,
  feedback: CLAUDE_FIRST,
  checkin: CLAUDE_FIRST,
  mock_exam_grade: CLAUDE_FIRST,

  // Gemini for high-volume teaching/extraction phases
  teach: GEMINI_FIRST,
  teach_chat: GEMINI_FIRST,
  key_concepts_extract: GEMINI_FIRST,
  chatbot: GEMINI_FIRST,
  onboarding_transition: GEMINI_FIRST,
  safety_classifier: GEMINI_FIRST,
  grounded_teach: GEMINI_FIRST,
  mock_exam_generate: GEMINI_FIRST,
  snap_solve: GEMINI_FIRST,
  material_ingest: CLAUDE_FIRST,
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
