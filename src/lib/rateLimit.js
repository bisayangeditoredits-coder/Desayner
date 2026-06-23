import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@/lib/redis';

const ephemeralCaches = globalThis.__desaynerRateLimitCaches ??= new Map();

function getEphemeralCache(prefix) {
  if (!ephemeralCaches.has(prefix)) {
    ephemeralCaches.set(prefix, new Map());
  }

  return ephemeralCaches.get(prefix);
}

export function createRateLimit({ prefix, limiter, analytics = false }) {
  return new Ratelimit({
    redis,
    limiter,
    analytics,
    prefix,
    ephemeralCache: getEphemeralCache(prefix),
  });
}

export async function safeLimit(ratelimit, identifier, { failOpen = true, logPrefix = 'RateLimit' } = {}) {
  try {
    return await ratelimit.limit(identifier);
  } catch (error) {
    console.error(`[${logPrefix}] Upstash rate limit failed`, error);

    if (!failOpen) {
      return {
        success: false,
        limit: 0,
        remaining: 0,
        reset: Date.now() + 60_000,
      };
    }

    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: Date.now() + 60_000,
    };
  }
}

export { Ratelimit };
