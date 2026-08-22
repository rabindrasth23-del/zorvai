/**
 * Per-user rate limiter — Upstash Redis sliding window.
 *
 * Production: Uses @upstash/ratelimit backed by Upstash Redis.
 * Development fallback: If UPSTASH_REDIS_REST_URL is not set,
 * falls back to in-memory (with a console warning on first use).
 *
 * Required env vars for production:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 *
 * Usage in API routes:
 *   import { aiRouteLimiter } from '@/lib/rate-limiter';
 *   const { success } = await aiRouteLimiter.limit(userId);
 *   if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ---------------------------------------------------------------------------
// Check if Upstash is configured
// ---------------------------------------------------------------------------

const isUpstashConfigured = !!(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

let warnedAboutFallback = false;

function getRedis(): Redis {
  if (!isUpstashConfigured) {
    if (!warnedAboutFallback) {
      console.warn(
        '[rate-limiter] ⚠ UPSTASH_REDIS_REST_URL not set — using in-memory fallback. ' +
        'This does NOT work reliably in Vercel serverless. Set up Upstash Redis for production.'
      );
      warnedAboutFallback = true;
    }
    // Undocumented but supported: Ratelimit can accept a custom storage
    // We'll use Redis.fromEnv() which will throw — so we catch below
  }
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

// ---------------------------------------------------------------------------
// Rate limiter instances
// ---------------------------------------------------------------------------

function createLimiter(prefix: string, tokens: number, windowSec: number) {
  if (!isUpstashConfigured) {
    // In-memory fallback for local development only
    return createInMemoryLimiter(prefix, tokens, windowSec);
  }

  return new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(tokens, `${windowSec} s`),
    prefix: `zorvai:ratelimit:${prefix}`,
    analytics: true,
  });
}

/**
 * AI route limiter: 10 requests per 60 seconds per user.
 * Covers: /api/session/challenge, /api/session/evaluate, /api/session/teach
 */
export const aiRouteLimiter = createLimiter('ai', 10, 60);

/**
 * Transcription limiter: 5 requests per 60 seconds per user.
 * Whisper calls are expensive — tighter limit.
 */
export const transcribeLimiter = createLimiter('transcribe', 5, 60);

/**
 * Plan generation limiter: 3 requests per 5 minutes per user.
 * Plan generation should only happen once during onboarding.
 */
export const planLimiter = createLimiter('plan', 3, 300);

// ---------------------------------------------------------------------------
// In-memory fallback (development only — NOT production safe)
// ---------------------------------------------------------------------------

interface InMemoryEntry {
  timestamps: number[];
}

function createInMemoryLimiter(prefix: string, maxRequests: number, windowSec: number) {
  const store = new Map<string, InMemoryEntry>();
  const windowMs = windowSec * 1000;
  let lastCleanup = Date.now();

  return {
    async limit(identifier: string): Promise<{
      success: boolean;
      limit: number;
      remaining: number;
      reset: number;
    }> {
      // Periodic cleanup
      const now = Date.now();
      if (now - lastCleanup > 5 * 60_000) {
        lastCleanup = now;
        const cutoff = now - windowMs;
        for (const [key, entry] of store) {
          entry.timestamps = entry.timestamps.filter(t => t > cutoff);
          if (entry.timestamps.length === 0) store.delete(key);
        }
      }

      const key = `${prefix}:${identifier}`;
      const cutoff = now - windowMs;

      let entry = store.get(key);
      if (!entry) {
        entry = { timestamps: [] };
        store.set(key, entry);
      }

      entry.timestamps = entry.timestamps.filter(t => t > cutoff);

      if (entry.timestamps.length >= maxRequests) {
        const oldestInWindow = entry.timestamps[0];
        return {
          success: false,
          limit: maxRequests,
          remaining: 0,
          reset: oldestInWindow + windowMs,
        };
      }

      entry.timestamps.push(now);
      return {
        success: true,
        limit: maxRequests,
        remaining: maxRequests - entry.timestamps.length,
        reset: now + windowMs,
      };
    },
  };
}
