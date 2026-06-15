import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redis } from '@/lib/redis';

export const runtime = 'edge';

export async function GET(request, { params }) {
  try {
    const { username } = await params;
    const cacheKey = `profile_data_v2:${username.toLowerCase()}`;

    let profile = null;
    let projects = [];

    // 1. Try to read public data from cache
    let cachedData = null;
    try {
      cachedData = await redis.get(cacheKey);
      if (cachedData) {
        profile = cachedData.profile;
        projects = cachedData.projects;
      }
    } catch (err) {
      console.error('[Redis Cache GET Error]', err);
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    // 2. Fetch public data from DB if not in cache — run profile + auth in parallel
    if (!cachedData) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', username)
        .single();

      if (profileError || !profileData) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }

      // Fetch projects and auth in parallel
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, title, thumbnail_url, cover_url, category, views_count, likes_count, saves_count, created_at, user_id, profiles!projects_user_id_fkey(username, full_name, avatar_url)')
        .eq('user_id', profileData.id)
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(50);

      profile = profileData;
      projects = projectsData || [];

      // Cache the public response in Redis for 5 minutes
      try {
        await redis.setex(cacheKey, 300, { profile, projects });
      } catch (err) {
        console.error('[Redis Cache SET Error]', err);
      }
    }

    // 3. Resolve user-specific private state
    let savedProjects = [];
    let collections = [];
    let isFollowing = false;
    let currentUser = null;

    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      currentUser = user;
      
      if (user.id === profile.id) {
        // Owner viewing their own profile: fetch saved projects
        const { data: savedData } = await supabase
          .from('project_saves')
          .select('projects(id, title, thumbnail_url, cover_url, category, views_count, likes_count, saves_count, created_at, user_id, profiles!projects_user_id_fkey(username, full_name, avatar_url))')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(50);
          
        savedProjects = (savedData || []).map(r => r.projects).filter(Boolean);

        // Fetch collections
        const { data: colsData } = await supabase
          .from('collections')
          .select('id, name, created_at, collection_items(projects(id, title, thumbnail_url, cover_url, category, views_count, likes_count, saves_count, created_at, user_id, profiles!projects_user_id_fkey(username, full_name, avatar_url)))')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (colsData) {
          collections = colsData.map(c => ({
            id: c.id,
            name: c.name,
            created_at: c.created_at,
            items: (c.collection_items || []).map(ci => ci.projects).filter(Boolean)
          }));
        }
      } else {
        // Visitor viewing someone else's profile: check follow status
        const { data: followData } = await supabase
          .from('follows')
          .select('follower_id')
          .eq('follower_id', user.id)
          .eq('following_id', profile.id)
          .maybeSingle();
          
        isFollowing = !!followData;
      }
      
      // Resolve liked state for projects and saved projects in parallel
      const projectIds = projects.map(p => p.id);
      const savedIds = savedProjects.map(p => p.id);
      const allIds = [...new Set([...projectIds, ...savedIds])];

      if (allIds.length > 0) {
        const { data: likedList } = await supabase
          .from('project_likes')
          .select('project_id')
          .eq('user_id', user.id)
          .in('project_id', allIds);

        const likedSet = new Set((likedList || []).map(l => l.project_id));
        projects.forEach(p => { p.user_liked = likedSet.has(p.id); });
        savedProjects.forEach(p => { p.user_liked = likedSet.has(p.id); });
        collections.forEach(c => {
          c.items.forEach(p => { p.user_liked = likedSet.has(p.id); });
        });
      }
    }

    return NextResponse.json({
      profile,
      projects,
      savedProjects,
      collections,
      isFollowing,
      currentUser,
      cached: !!cachedData
    }, {
      headers: { 'Cache-Control': 'private, s-maxage=0' } // private — user-specific
    });

  } catch (err) {
    console.error('[GET /api/profile Error]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
