import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { swrCache } from '@/lib/cache';
import { projectsCacheKey } from '@/lib/cacheKeys';
import { buildPublishedProjectsQuery, parseSearchQuery } from '@/lib/projectSearch';

export const runtime = 'edge';
const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' };

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

    // Reject searches that sanitize to nothing (e.g. only special characters)
    if (rawQ && !ftsQuery) {
      return NextResponse.json({ projects: [], cached: false }, { headers: CACHE_HEADERS });
    }

    const cacheKey = projectsCacheKey(category, ftsQuery, limit, offset, safeSort);

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

      const query = buildPublishedProjectsQuery(supabase, {
        ftsQuery,
        category,
        sort: safeSort,
        offset,
        limit,
      });

      const { data, error } = await query;
      if (error) {
        throw error;
      }

      return data || [];
    };

    const { data: items, cached } = await swrCache(cacheKey, 60, fetcher);

    return NextResponse.json({ projects: items, cached }, { headers: CACHE_HEADERS });
  } catch (err) {
    console.error('[GET /api/projects Error]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
