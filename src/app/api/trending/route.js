import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redis } from '@/lib/redis';

export async function GET() {
  const CACHE_KEY = 'trending_projects';
  
  // 1. Check Redis cache first
  try {
    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      return NextResponse.json({ projects: cached, cached: true });
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

  const { data, error } = await supabase
    .from('projects')
    .select('*, profiles!projects_user_id_fkey(username, full_name, avatar_url)')
    .eq('published', true)
    .order('likes_count', { ascending: false })
    .limit(12);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const projects = data || [];

  // 3. Save to Redis (cache for 5 seconds to show new projects instantly)
  try {
    await redis.setex(CACHE_KEY, 5, projects);
  } catch (err) {
    console.error('Redis cache write error:', err);
  }

  return NextResponse.json({ projects, cached: false });
}
