import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redis } from '@/lib/redis';

export const runtime = 'edge';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 50;

const PROJECT_SELECT =
  'id, title, thumbnail_url, cover_url, category, views_count, likes_count, saves_count, created_at, user_id, profiles!projects_user_id_fkey(username, full_name, avatar_url)';

async function attachUserLikes(supabase, userId, projects) {
  if (!userId || !projects.length) return projects;

  const { data: likedList } = await supabase
    .from('project_likes')
    .select('project_id')
    .eq('user_id', userId)
    .in('project_id', projects.map((p) => p.id));

  const likedSet = new Set((likedList || []).map((l) => l.project_id));
  return projects.map((p) => ({ ...p, user_liked: likedSet.has(p.id) }));
}

export async function GET(request, { params }) {
  try {
    const { username } = await params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT, 1),
      MAX_LIMIT
    );
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0);

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    // Fast path: paginated project loads skip profile/collections/saved fetches
    if (offset > 0) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', username)
        .single();

      if (profileError || !profileData) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }

      const { data: projectsData } = await supabase
        .from('projects')
        .select(PROJECT_SELECT)
        .eq('user_id', profileData.id)
        .eq('published', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit);

      let projects = projectsData || [];
      const hasMore = projects.length > limit;
      if (hasMore) projects = projects.slice(0, limit);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        projects = await attachUserLikes(supabase, user.id, projects);
      }

      return NextResponse.json({
        projects,
        hasMore,
        limit,
        offset,
        cached: false,
      }, {
        headers: { 'Cache-Control': 'private, s-maxage=0' },
      });
    }

    const cacheKey = `profile_data_v2:${username.toLowerCase()}:${limit}:${offset}`;

    let profile = null;
    let projects = [];
    let hasMore = false;

    let cachedData = null;
    try {
      cachedData = await redis.get(cacheKey);
      if (cachedData) {
        profile = cachedData.profile;
        projects = cachedData.projects;
        hasMore = cachedData.hasMore ?? false;
      }
    } catch (err) {
      console.error('[Redis Cache GET Error]', err);
    }

    if (!cachedData) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', username)
        .single();

      if (profileError || !profileData) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }

      const { data: projectsData } = await supabase
        .from('projects')
        .select(PROJECT_SELECT)
        .eq('user_id', profileData.id)
        .eq('published', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit);

      profile = profileData;
      projects = projectsData || [];
      hasMore = projects.length > limit;
      if (hasMore) projects = projects.slice(0, limit);

      try {
        await redis.setex(cacheKey, 300, { profile, projects, hasMore });
      } catch (err) {
        console.error('[Redis Cache SET Error]', err);
      }
    }

    let isFollowing = false;
    let currentUser = null;

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      currentUser = user;

      if (user.id !== profile.id) {
        const { data: followData } = await supabase
          .from('follows')
          .select('follower_id')
          .eq('follower_id', user.id)
          .eq('following_id', profile.id)
          .maybeSingle();

        isFollowing = !!followData;
      }

      const projectIds = projects.map((p) => p.id);

      if (projectIds.length > 0) {
        const { data: likedList } = await supabase
          .from('project_likes')
          .select('project_id')
          .eq('user_id', user.id)
          .in('project_id', projectIds);

        const likedSet = new Set((likedList || []).map((l) => l.project_id));
        projects = projects.map((p) => ({ ...p, user_liked: likedSet.has(p.id) }));
      }
    }

    return NextResponse.json({
      profile,
      projects,
      isFollowing,
      currentUser,
      hasMore,
      limit,
      offset,
      cached: !!cachedData,
    }, {
      headers: { 'Cache-Control': 'private, s-maxage=0' },
    });
  } catch (err) {
    console.error('[GET /api/profile Error]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
