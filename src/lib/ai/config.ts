/**
 * AI Provider Engine — Configuration
 *
 * Per-call-type provider chains, timeouts, and circuit breaker settings.
 * All AI calls route through runAICall() which uses these chains.
 */

// ---------------------------------------------------------------------------
// Provider identifiers
// ---------------------------------------------------------------------------

export type ProviderId = 'claude' | 'deepseek' | 'qwen' | 'glm' | 'kimi';

export type CallType =
  | 'plan'
  | 'teach'
  | 'recall'
  | 'challenge'
  | 'feedback'
  | 'chatbot'
  | 'checkin';

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
  claude: {
    id: 'claude',
    name: 'Claude (Anthropic)',
    model: 'claude-sonnet-4-20250514',
    apiKeyEnv: 'ANTHROPIC_API_KEY',
    timeoutMs: 30_000,
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    model: 'deepseek-chat',
    baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    timeoutMs: 20_000,
  },
  qwen: {
    id: 'qwen',
    name: 'Qwen (Alibaba)',
    model: 'qwen-plus',
    baseUrl: process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKeyEnv: 'QWEN_API_KEY',
    timeoutMs: 20_000,
  },
  glm: {
    id: 'glm',
    name: 'GLM (Zhipu)',
    model: 'glm-4-flash',
    baseUrl: process.env.GLM_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4',
    apiKeyEnv: 'GLM_API_KEY',
    timeoutMs: 20_000,
  },
  kimi: {
    id: 'kimi',
    name: 'Kimi (Moonshot)',
    model: 'moonshot-v1-8k',
    baseUrl: process.env.KIMI_BASE_URL || 'https://api.moonshot.cn/v1',
    apiKeyEnv: 'KIMI_API_KEY',
    timeoutMs: 20_000,
  },
};

// ---------------------------------------------------------------------------
// Per-call-type provider chains
// ---------------------------------------------------------------------------

/**
 * Default chain: Claude → DeepSeek → Qwen → GLM → Kimi
 * Used for all coaching/plan call types.
 */
const DEFAULT_CHAIN: ProviderId[] = ['claude', 'deepseek', 'qwen', 'glm', 'kimi'];

/**
 * Check-in chain: Claude only + a named fallback placeholder.
 *
 * CHECKIN_FALLBACK_PROVIDER is a compliance decision, NOT a forgotten key.
 * If Claude fails and the fallback is unset, the engine throws rather than
 * silently falling through to any provider. This is intentional — see TRD
 * Section 4 and Checkin Escalation doc.
 */
function getCheckinChain(): ProviderId[] {
  const fallback = process.env.CHECKIN_FALLBACK_PROVIDER as ProviderId | undefined;
  if (fallback && PROVIDERS[fallback]) {
    return ['claude', fallback];
  }
  // Only Claude — if Claude fails, engine will throw with a clear message
  return ['claude'];
}

export const PROVIDER_CHAINS: Record<CallType, ProviderId[]> = {
  plan: DEFAULT_CHAIN,
  teach: DEFAULT_CHAIN,
  recall: DEFAULT_CHAIN,
  challenge: DEFAULT_CHAIN,
  feedback: DEFAULT_CHAIN,
  chatbot: DEFAULT_CHAIN,
  checkin: getCheckinChain(),
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
