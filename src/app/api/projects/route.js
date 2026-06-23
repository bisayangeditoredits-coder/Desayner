import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { swrCache } from '@/lib/cache';
import { projectsCacheKey } from '@/lib/cacheKeys';
import { buildPublishedProjectsQuery, parseSearchQuery } from '@/lib/projectSearch';
import { redis } from '@/lib/redis';
import { createRateLimit, Ratelimit, safeLimit } from '@/lib/rateLimit';

export const runtime = 'edge';
const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' };

// Rate limit: 30 searches per 10 seconds per IP
const searchRateLimit = createRateLimit({
  limiter: Ratelimit.slidingWindow(30, '10 s'),
  analytics: false,
  prefix: 'rl:search',
});

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'All';
    const rawQ = (searchParams.get('q') || '').trim();
    const ftsQuery = parseSearchQuery(rawQ);
    const limit = parseInt(searchParams.get('limit') || '24', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const sort = searchParams.get('sort') || 'newest';
    const ALLOWED_SORTS = ['newest', 'popular', 'trending'];
    const safeSort = ALLOWED_SORTS.includes(sort) ? sort : 'newest';

    const cursor = searchParams.get('cursor') || null;

    // Reject searches that sanitize to nothing (e.g. only special characters)
    if (rawQ && !ftsQuery) {
      return NextResponse.json({ projects: [], cached: false }, { headers: CACHE_HEADERS });
    }

    // Apply rate limiting specifically for searches
    if (ftsQuery) {
      const ip = request.ip || request.headers.get('x-forwarded-for') || 'anonymous';
      const { success, remaining } = await safeLimit(searchRateLimit, `ip:${ip}`, {
        logPrefix: 'Projects Search RateLimit',
      });
      
      if (!success) {
        return NextResponse.json(
          { error: 'Too many search requests. Please wait a moment.' },
          { 
            status: 429,
            headers: { 
              'X-RateLimit-Remaining': String(remaining),
              ...CACHE_HEADERS
            }
          }
        );
      }
    }

    // cacheKey now includes cursor. For fallback sorts, it uses offset.
    const cacheKey = projectsCacheKey(category, ftsQuery, limit, offset, safeSort, cursor);

    const fetcher = async () => {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          cookies: {
            getAll: () => [],
            setAll: () => {},
          },
        },
      );

      // Fetch limit + 1 to check if there is a next page
      const fetchLimit = safeSort === 'newest' ? limit + 1 : limit;

      const query = buildPublishedProjectsQuery(supabase, {
        ftsQuery,
        category,
        sort: safeSort,
        offset,
        limit: fetchLimit,
        cursor,
      });

      const { data, error } = await query;
      if (error) {
        throw error;
      }

      return data || [];
    };

    const { data: items, cached } = await swrCache(cacheKey, 60, fetcher);

    let resultItems = items;
    let nextCursor = null;

    if (safeSort === 'newest' && items.length > limit) {
      nextCursor = items[limit].created_at;
      resultItems = items.slice(0, limit);
    }

    return NextResponse.json({ projects: resultItems, cached, nextCursor }, { headers: CACHE_HEADERS });
  } catch (err) {
    console.error('[GET /api/projects Error]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
