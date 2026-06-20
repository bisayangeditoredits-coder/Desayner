import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { swrCache } from '@/lib/cache';
import { TRENDING_CACHE_KEY } from '@/lib/cacheKeys';

const CACHE_HEADERS = { 'Cache-Control': 's-maxage=120, stale-while-revalidate=60' };

export async function GET() {
  const fetcher = async () => {
    // Public query — no session needed, use anon key with empty cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );

    const { data, error } = await supabase
      .from('projects')
      .select('id, title, thumbnail_url, cover_url, category, views_count, likes_count, saves_count, created_at, user_id, profiles!projects_user_id_fkey(username, full_name, avatar_url)')
      .eq('published', true)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('likes_count', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data || [];
  };

  try {
    const { data: projects, cached } = await swrCache(TRENDING_CACHE_KEY, 120, fetcher);
    return NextResponse.json({ projects, cached }, { headers: CACHE_HEADERS });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
