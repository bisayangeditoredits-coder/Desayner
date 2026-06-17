import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redis } from '@/lib/redis';

export const runtime = 'edge';

export async function GET() {
  const CACHE_KEY = 'top_designers_list_v1';
  
  // 1. Check Redis cache first
  try {
    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      return NextResponse.json({ designers: cached, cached: true });
    }
  } catch (err) {
    console.error('Redis cache read error:', err);
  }

  // 2. Cache miss — fetch from Supabase
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll: () => [] } }
  );

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, followers_count, projects_count, cover_url')
    .order('followers_count', { ascending: false })
    .limit(8);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ designers: [], cached: false });
  }

  const userIds = profiles.map(u => u.id);
  const { data: projectsData } = await supabase
    .from('projects')
    .select('user_id, cover_url, thumbnail_url')
    .in('user_id', userIds)
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(userIds.length * 3); // max 3 covers per designer

  // Build a Map for O(1) lookup instead of O(n²) find() in a loop
  const projectsByUser = new Map();
  for (const p of (projectsData || [])) {
    if (!projectsByUser.has(p.user_id)) {
      projectsByUser.set(p.user_id, p);
    }
  }

  const processed = profiles.map(u => {
    const userProj = projectsByUser.get(u.id);
    return {
      ...u,
      banner_url: u.cover_url || (userProj ? userProj.thumbnail_url || userProj.cover_url : null)
    };
  });

  // 3. Save to Redis — Top Designers change slowly, cache for 5 minutes
  try {
    await redis.setex(CACHE_KEY, 300, processed);
  } catch (err) {
    console.error('Redis cache write error:', err);
  }

  return NextResponse.json({ designers: processed, cached: false }, {
    headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=120' }
  });
}
