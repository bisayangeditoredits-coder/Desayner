import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { redis } from '@/lib/redis';
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

    // Reject searches that sanitize to nothing (e.g. only special characters)
    if (rawQ && !ftsQuery) {
      return NextResponse.json({ projects: [], cached: false }, { headers: CACHE_HEADERS });
    }

    const cacheKey = projectsCacheKey(category, ftsQuery, limit, offset);

    // Try to read from cache
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const items = (cached.projects || []).map((project) => ({ ...project }));
        return NextResponse.json({ projects: items, cached: true }, { headers: CACHE_HEADERS });
      }
    } catch (err) {
      console.error('[Redis Cache GET Error]', err);
    }

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
      sort: 'newest',
      offset,
      limit,
    });

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const items = data || [];

    try {
      await redis.setex(cacheKey, 60, { projects: items });
    } catch (err) {
      console.error('[Redis Cache SET Error]', err);
    }

    return NextResponse.json({ projects: items, cached: false }, { headers: CACHE_HEADERS });
  } catch (err) {
    console.error('[GET /api/projects Error]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
