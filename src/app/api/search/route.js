import { NextResponse } from 'next/server';
import { createReadClient } from '@/lib/supabase/server';
import { redis } from '@/lib/redis';
import { buildPublishedProjectsQuery, parseSearchQuery } from '@/lib/projectSearch';
import { createRateLimit, Ratelimit, safeLimit } from '@/lib/rateLimit';

const CACHE_HEADERS = { 'Cache-Control': 's-maxage=60, stale-while-revalidate=30' };
const ratelimit = createRateLimit({
  limiter: Ratelimit.slidingWindow(30, '60 s'),
  analytics: false,
  prefix: 'rl:search',
});

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rawQ = (searchParams.get('q') || '').trim();
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 24;
  const offset = (page - 1) * limit;

  const ftsQuery = parseSearchQuery(rawQ);
  if (!ftsQuery) return NextResponse.json({ projects: [], total: 0 });

  const cacheKey = `search_v2:${ftsQuery}:${category}:${sort}:${page}`;
  if (page === 1) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json({ ...cached, cached: true }, { headers: CACHE_HEADERS });
      }
    } catch (err) {
      console.error('[Search Redis GET Error]', err);
    }
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
  const { success, remaining } = await safeLimit(ratelimit, `ip:${ip}`, {
    logPrefix: 'Search RateLimit',
  });
  if (!success) {
    return NextResponse.json(
      { error: 'Too many search requests. Please slow down.' },
      { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } },
    );
  }

  const supabase = createReadClient();
  const query = buildPublishedProjectsQuery(supabase, {
    ftsQuery,
    category: category || 'All',
    sort,
    offset,
    limit,
    withCount: true,
  });

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const result = { projects: data || [], total: count || 0, cached: false };

  if (page === 1) {
    try {
      await redis.setex(cacheKey, 60, result);
    } catch (err) {
      console.error('[Search Redis SET Error]', err);
    }
  }

  return NextResponse.json(result, { headers: CACHE_HEADERS });
}