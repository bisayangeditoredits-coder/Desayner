import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redis } from '@/lib/redis';

export const runtime = 'edge';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'All';
    const limit = parseInt(searchParams.get('limit') || '24', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const cacheKey = `projects:${category}:${limit}:${offset}`;

    // 1. Read first page from cache
    if (offset === 0) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          // Resolve current user liked state dynamically
          const cookieStore = await cookies();
          const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            { cookies: { getAll: () => cookieStore.getAll() } }
          );
          const { data: { user } } = await supabase.auth.getUser();

          const items = cached.projects || [];
          if (user && items.length > 0) {
            const projectIds = items.map(p => p.id);
            const { data: likedList } = await supabase
              .from('project_likes')
              .select('project_id')
              .eq('user_id', user.id)
              .in('project_id', projectIds);

            const likedSet = new Set((likedList || []).map(l => l.project_id));
            items.forEach(p => { p.user_liked = likedSet.has(p.id); });
          }
          return NextResponse.json({ projects: items, cached: true });
        }
      } catch (err) {
        console.error('[Redis Cache GET Error]', err);
      }
    }

    // 2. Fetch from database
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    let query = supabase
      .from('projects')
      .select('*, profiles!projects_user_id_fkey(username, full_name, avatar_url)')
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

    // 3. Resolve user likes for DB fetch
    const { data: { user } } = await supabase.auth.getUser();
    if (user && items.length > 0) {
      const projectIds = items.map(p => p.id);
      const { data: likedList } = await supabase
        .from('project_likes')
        .select('project_id')
        .eq('user_id', user.id)
        .in('project_id', projectIds);

      const likedSet = new Set((likedList || []).map(l => l.project_id));
      items.forEach(p => { p.user_liked = likedSet.has(p.id); });
    }

    // 4. Cache first page responses to Redis cache for 10 seconds
    if (offset === 0) {
      try {
        await redis.setex(cacheKey, 10, { projects: items });
      } catch (err) {
        console.error('[Redis Cache SET Error]', err);
      }
    }

    return NextResponse.json({ projects: items, cached: false });

  } catch (err) {
    console.error('[GET /api/projects Error]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
