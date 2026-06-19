export const TRENDING_CACHE_KEY = 'trending_projects_top_10_v2';
export const DEFAULT_PAGE_SIZE = 24;

/** Build a Redis key for the projects feed cache. */
export function projectsCacheKey(category = 'All', q = '', limit = DEFAULT_PAGE_SIZE, offset = 0, sort = 'newest') {
  return `projects_v2:${category}:${q}:${limit}:${offset}:${sort}`;
}

/**
 * Invalidate first-page feed + trending caches after real mutations
 * (publish, like, delete). Does NOT clear paginated pages beyond offset 0
 * since those are rarely accessed and will naturally expire via SWR TTL.
 */
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

/**
 * Targeted cache invalidation for publish/update/delete events.
 * Only clears first-page caches for the affected category + All + trending.
 * More precise than invalidateFeedCaches — does not wipe unrelated sort views.
 *
 * @param {object} redis - Redis client
 * @param {object} opts
 * @param {string} [opts.category] - The project's category
 * @param {string} [opts.username] - Author's username (to also clear profile cache)
 */
export async function invalidateOnPublish(redis, { category, username } = {}) {
  const keys = [
    projectsCacheKey('All', '', DEFAULT_PAGE_SIZE, 0, 'newest'),
    projectsCacheKey('All', '', DEFAULT_PAGE_SIZE, 0, 'trending'),
    TRENDING_CACHE_KEY,
  ];

  if (category && category !== 'All') {
    keys.push(projectsCacheKey(category, '', DEFAULT_PAGE_SIZE, 0, 'newest'));
    keys.push(projectsCacheKey(category, '', DEFAULT_PAGE_SIZE, 0, 'trending'));
  }

  if (username) {
    keys.push(`profile_data_v2:${username.toLowerCase()}:50:0`);
    keys.push(`profile_data:${username.toLowerCase()}`);
  }

  await redis.del(...keys);
}
