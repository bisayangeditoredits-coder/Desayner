import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redis } from '@/lib/redis';

export const runtime = 'edge';

export async function GET(request, { params }) {
  try {
    const { username } = await params;
    const cacheKey = `profile_data:${username.toLowerCase()}`;

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

    // 2. Fetch public data from DB if not in cache
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
        .select('*, profiles!projects_user_id_fkey(username, full_name, avatar_url)')
        .eq('user_id', profileData.id)
        .eq('published', true)
        .order('created_at', { ascending: false });

      profile = profileData;
      projects = projectsData || [];

      // Cache the public response in Redis for 10 seconds
      try {
        await redis.setex(cacheKey, 10, { profile, projects });
      } catch (err) {
        console.error('[Redis Cache SET Error]', err);
      }
    }

    // 3. Resolve user-specific private state
    let savedProjects = [];
    let isFollowing = false;
    let currentUser = null;

    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      currentUser = user;
      
      if (user.id === profile.id) {
        // Owner viewing their own profile: fetch saved projects
        const { data: savedData } = await supabase
          .from('project_saves')
          .select('projects(*, profiles!projects_user_id_fkey(username, full_name, avatar_url))')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false });
          
        savedProjects = (savedData || []).map(r => r.projects).filter(Boolean);
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
      
      // Also resolve user_liked state for projects
      if (projects.length > 0) {
        const projectIds = projects.map(p => p.id);
        const { data: likedList } = await supabase
          .from('project_likes')
          .select('project_id')
          .eq('user_id', user.id)
          .in('project_id', projectIds);

        const likedSet = new Set((likedList || []).map(l => l.project_id));
        projects.forEach(p => { p.user_liked = likedSet.has(p.id); });
      }
      
      // Also resolve user_liked state for saved projects
      if (savedProjects.length > 0) {
        const savedProjectIds = savedProjects.map(p => p.id);
        const { data: savedLikedList } = await supabase
          .from('project_likes')
          .select('project_id')
          .eq('user_id', user.id)
          .in('project_id', savedProjectIds);

        const savedLikedSet = new Set((savedLikedList || []).map(l => l.project_id));
        savedProjects.forEach(p => { p.user_liked = savedLikedSet.has(p.id); });
      }
    }

    return NextResponse.json({
      profile,
      projects,
      savedProjects,
      isFollowing,
      currentUser,
      cached: !!cachedData
    });

  } catch (err) {
    console.error('[GET /api/profile Error]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
