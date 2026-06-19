import { redis } from '@/lib/redis';
import { waitUntil } from '@vercel/functions';

/**
 * Advanced Redis Cache with Stale-While-Revalidate (SWR) pattern.
 *
 * Instead of simple TTL expirations which cause the "Thundering Herd" problem,
 * this approach serves stale data to users while silently triggering a background
 * promise to fetch fresh data and update the cache.
 *
 * Uses `waitUntil` from @vercel/functions to ensure the background refresh
 * completes even after the edge response has been sent — without it, Vercel
 * kills the edge function before the promise resolves.
 *
 * @param {string} key - The Redis cache key
 * @param {number} revalidateAfterSeconds - When data becomes stale (triggers background refresh)
 * @param {Function} fetcher - Async function returning fresh data
 * @returns {Promise<any>} The cached or fresh data
 */
export async function swrCache(key, revalidateAfterSeconds, fetcher) {
  try {
    const cached = await redis.get(key);

    // Cache miss — must fetch synchronously
    if (!cached) {
      const data = await fetcher();
      await redis.set(key, { data, timestamp: Date.now() });
      return { data, cached: false };
    }

    const { data, timestamp } = cached;
    const isStale = Date.now() - timestamp > revalidateAfterSeconds * 1000;

    // Cache hit but STALE — return stale data immediately and schedule background refresh.
    // waitUntil keeps the Vercel Edge process alive until the background promise settles,
    // preventing the refresh from being silently killed before it writes to Redis.
    if (isStale) {
      const backgroundRefresh = fetcher()
        .then((freshData) => redis.set(key, { data: freshData, timestamp: Date.now() }))
        .catch((err) => console.error(`[SWR Background Fetch Error] for key ${key}:`, err));

      try {
        waitUntil(backgroundRefresh);
      } catch {
        // waitUntil not available outside Vercel (e.g. local dev) — ignore silently
      }
    }

    return { data, cached: true };
  } catch (err) {
    console.error(`[swrCache] Error with key ${key}:`, err);
    // On cache failure, gracefully degrade to fetching directly
    const data = await fetcher();
    return { data, cached: false };
  }
}
