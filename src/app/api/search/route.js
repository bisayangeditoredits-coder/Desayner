import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redis } from '@/lib/redis';
import { buildPublishedProjectsQuery, parseSearchQuery } from '@/lib/projectSearch';
import { Ratelimit } from '@upstash/ratelimit';

export const runtime = 'edge';
const CACHE_HEADERS = { 'Cache-Control': 's-maxage=60, stale-while-revalidate=30' };

// 30 search requests per user/IP per 60 seconds
const ratelimit = new Ratelimit({
  redis,
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
  const { success, remaining } = await ratelimit.limit(`ip:${ip}`);
  if (!success) {
    return NextResponse.json(
      { error: 'Too many search requests. Please slow down.' },
      { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } },
    );
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll: () => cookieStore.getAll() } },
  );

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
