import { redis } from '@/lib/redis';

/**
 * Advanced Redis Cache with Stale-While-Revalidate (SWR) pattern.
 * 
 * Instead of simple TTL expirations which cause the "Thundering Herd" problem,
 * this approach serves stale data to users while silently triggering a background 
 * promise to fetch fresh data and update the cache.
 * 
 * @param {string} key - The Redis cache key
 * @param {number} revalidateAfterSeconds - When data becomes stale (triggers background refresh)
 * @param {Function} fetcher - Async function returning fresh data
 * @returns {Promise<any>} The cached or fresh data
 */
export async function swrCache(key, revalidateAfterSeconds, fetcher) {
  try {
    const cached = await redis.get(key);
    
    // Cache miss - we must fetch synchronously
    if (!cached) {
      const data = await fetcher();
      await redis.set(key, { data, timestamp: Date.now() });
      return { data, cached: false };
    }

    const { data, timestamp } = cached;
    const isStale = Date.now() - timestamp > revalidateAfterSeconds * 1000;

    // Cache hit but STALE - return stale data immediately, but trigger background fetch
    if (isStale) {
      // Note: Edge functions might abort background tasks if not awaited, 
      // but in Next.js App Router (edge or Node) waitUntil can be used if available,
      // or we just fire and forget. Upstash Redis calls over HTTP usually complete quickly.
      fetcher()
        .then((freshData) => redis.set(key, { data: freshData, timestamp: Date.now() }))
        .catch((err) => console.error(`[SWR Background Fetch Error] for key ${key}:`, err));
    }

    return { data, cached: true };
  } catch (err) {
    console.error(`[swrCache] Error with key ${key}:`, err);
    // On cache failure, gracefully degrade to fetching directly
    const data = await fetcher();
    return { data, cached: false };
  }
}
