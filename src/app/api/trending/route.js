import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { swrCache } from '@/lib/cache';
import { TRENDING_CACHE_KEY } from '@/lib/cacheKeys';

export const runtime = 'edge';
const CACHE_HEADERS = { 'Cache-Control': 's-maxage=120, stale-while-revalidate=60' };

export async function GET() {
  const CACHE_KEY = TRENDING_CACHE_KEY;
  
  const fetcher = async () => {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data, error } = await supabase
      .from('projects')
      .select('id, title, thumbnail_url, cover_url, category, views_count, likes_count, saves_count, created_at, user_id, profiles!projects_user_id_fkey(username, full_name, avatar_url)')
      .eq('published', true)
      .order('likes_count', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data || [];
  };

  try {
    const { data: projects, cached } = await swrCache(CACHE_KEY, 120, fetcher);
    return NextResponse.json({ projects, cached }, { headers: CACHE_HEADERS });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
