export const TRENDING_CACHE_KEY = 'trending_projects_top_10_v2';
export const DEFAULT_PAGE_SIZE = 24;

/** Build a Redis key for the projects feed cache. */
export function projectsCacheKey(category = 'All', q = '', limit = DEFAULT_PAGE_SIZE, offset = 0, sort = 'newest') {
  return `projects_v2:${category}:${q}:${limit}:${offset}:${sort}`;
}

/** Invalidate first-page feed + trending caches after mutations. */
export async function invalidateFeedCaches(redis, { category } = {}) {
  const keys = new Set([
    projectsCacheKey('All'),
    TRENDING_CACHE_KEY,
  ]);
  if (category && category !== 'All') {
    keys.add(projectsCacheKey(category));
  }
  await redis.del(...keys);
}
