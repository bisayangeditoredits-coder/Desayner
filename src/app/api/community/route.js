import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redis } from '@/lib/redis';

export const runtime = 'edge';
const CACHE_HEADERS = { 'Cache-Control': 's-maxage=10, stale-while-revalidate=30' };

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'All';
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const cacheKey = `community_feed:${filter}:${limit}`;

    // 1. Try to read from cache
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json({ posts: cached.posts || [], cached: true }, { headers: CACHE_HEADERS });
      }
    } catch (err) {
      console.error('[Redis Cache GET Error]', err);
    }

    // 2. Fetch from DB if not in cache
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    let query = supabase
      .from('community_posts')
      .select('*, profiles!community_posts_user_id_fkey(username, full_name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (filter !== 'All') {
      query = query.eq('post_type', filter.toLowerCase());
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const posts = data || [];

    // 3. Cache the response in Redis for 10 seconds
    try {
      await redis.setex(cacheKey, 10, { posts });
    } catch (err) {
      console.error('[Redis Cache SET Error]', err);
    }

    return NextResponse.json({ posts, cached: false }, { headers: CACHE_HEADERS });

  } catch (err) {
    console.error('[GET /api/community Error]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
