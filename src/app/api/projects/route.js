import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { redis } from '@/lib/redis';

export const runtime = 'edge';
const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' };

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'All';
    const limit = parseInt(searchParams.get('limit') || '24', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const cacheKey = `projects_v2:${category}:${limit}:${offset}`;

    // 1. Read first page from cache
    if (offset === 0) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          const items = (cached.projects || []).map((project) => ({ ...project }));
          return NextResponse.json({ projects: items, cached: true }, { headers: CACHE_HEADERS });
        }
      } catch (err) {
        console.error('[Redis Cache GET Error]', err);
      }
    }

    // 2. Fetch from database
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { 
        cookies: { 
          getAll: () => [],
          setAll: () => {}
        } 
      } // No cookies required for public data
    );

    let query = supabase
      .from('projects')
      .select('id, title, thumbnail_url, cover_url, category, views_count, likes_count, saves_count, created_at, user_id, profiles!projects_user_id_fkey(username, full_name, avatar_url)')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category !== 'All') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const items = data || [];



    // 4. Cache first page responses to Redis for 60 seconds
    if (offset === 0) {
      try {
        await redis.setex(cacheKey, 60, { projects: items });
      } catch (err) {
        console.error('[Redis Cache SET Error]', err);
      }
    }

    return NextResponse.json({ projects: items, cached: false }, { headers: CACHE_HEADERS });

  } catch (err) {
    console.error('[GET /api/projects Error]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
