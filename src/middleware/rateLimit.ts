import { redis } from '../lib/redis';

/**
 * Simple fixed‑window rate limiter.
 * Allows `limit` requests per `windowSec` seconds per IP.
 */
export async function rateLimit(request: Request, limit = 100, windowSec = 60) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('host') || 'unknown';
  const key = `rl:${ip}`;
  const current = await redis.incr(key);
  if (current === 1) {
    // Set expiry on first hit
    await redis.expire(key, windowSec);
  }
  return current <= limit;
}
