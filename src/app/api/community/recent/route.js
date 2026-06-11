import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redis } from '@/lib/redis';

export const runtime = 'edge';

export async function GET() {
  const CACHE_KEY = 'recent_community_posts_v1';
  
  // 1. Check Redis cache first
  try {
    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      return NextResponse.json({ posts: cached, cached: true });
    }
  } catch (err) {
    console.error('Redis cache read error:', err);
  }

  // 2. Cache miss — fetch from Supabase
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: posts, error } = await supabase
    .from('community_posts')
    .select('*, profiles!community_posts_user_id_fkey(username, full_name, avatar_url)')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const processedPosts = posts || [];

  // 3. Save to Redis — Cache for 1 minute (60s)
  try {
    await redis.setex(CACHE_KEY, 60, processedPosts);
  } catch (err) {
    console.error('Redis cache write error:', err);
  }

  return NextResponse.json({ posts: processedPosts, cached: false }, {
    headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=30' }
  });
}
