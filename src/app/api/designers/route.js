import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redis } from '@/lib/redis';

export const runtime = 'edge';
const CACHE_HEADERS = { 'Cache-Control': 's-maxage=10, stale-while-revalidate=30' };

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'All';
    const sort = searchParams.get('sort') || 'followers';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const PAGE_SIZE = 24;

    const cacheKey = `designers_feed:${category}:${sort}:${page}`;

    // 1. Try to read from cache (Only cache the first page for fast load)
    if (page === 1) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return NextResponse.json({ ...cached, cached: true }, { headers: CACHE_HEADERS });
        }
      } catch (err) {
        console.error('[Redis Cache GET Error]', err);
      }
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    // Prepare response payload
    let payload = {
      heroDesigner: null,
      featuredDesigners: [],
      risingDesigners: [],
      designers: [],
    };

    // 2. Fetch Editorial Sections (Only on Page 1)
    if (page === 1 && category === 'All') {
      // 2a. Fetch Active Featured Creators
      const { data: featuredData } = await supabase
        .from('featured_creators')
        .select('*, profiles(*)')
        .eq('is_active', true)
        .lte('start_date', new Date().toISOString())
        .gte('end_date', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(6);
        
      if (featuredData && featuredData.length > 0) {
        payload.heroDesigner = featuredData[0];
        payload.featuredDesigners = featuredData.slice(1);
      }

      // 2b. Fetch Rising Creators (Created in last 30 days, sorted by followers)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: risingData } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, bio, followers_count, projects_count, tools, created_at, available_for_work')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('followers_count', { ascending: false })
        .limit(4);
        
      if (risingData && risingData.length > 0) {
        // FIX: Single batch query instead of N+1 per-creator queries
        const risingIds = risingData.map(c => c.id);
        const { data: risingProjects } = await supabase
          .from('projects')
          .select('user_id, id, cover_url, thumbnail_url, title')
          .in('user_id', risingIds)
          .eq('published', true)
          .order('created_at', { ascending: false });

        // Group by user_id in JS (max 1 per rising creator)
        const risingProjectsByUser = {};
        (risingProjects || []).forEach(p => {
          if (!risingProjectsByUser[p.user_id]) {
            risingProjectsByUser[p.user_id] = p;
          }
        });

        payload.risingDesigners = risingData.map(creator => ({
          ...creator,
          sampleProjects: risingProjectsByUser[creator.id] ? [risingProjectsByUser[creator.id]] : [],
        }));
      } else {
        payload.risingDesigners = [];
      }
    }

    // 3. Fetch Main Creators Grid
    let query = supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, bio, location, followers_count, following_count, projects_count, created_at, tools, available_for_work')
      .not('username', 'is', null)
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    if (category !== 'All') {
      // Find users who have published projects in this category (Limit to 5000 recent to prevent OOM on large scale)
      const { data: catUsers } = await supabase
        .from('projects')
        .select('user_id')
        .eq('category', category)
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(5000);
        
      const userIds = Array.from(new Set((catUsers || []).map(p => p.user_id)));
      if (userIds.length > 0) {
        query = query.in('id', userIds);
      } else {
        // If no users have projects in this category, force empty result
        query = query.eq('id', '00000000-0000-0000-0000-000000000000');
      }
    }

    if (sort === 'followers') {
      query = query
        .order('projects_count', { ascending: false, nullsFirst: false })
        .order('followers_count', { ascending: false, nullsFirst: false });
    } else if (sort === 'newest') {
      query = query.order('created_at', { ascending: false });
    } else if (sort === 'projects') {
      query = query.order('projects_count', { ascending: false, nullsFirst: false });
    }

    const { data: gridCreators, error: gridError } = await query;
    if (gridError) throw gridError;

    // FIX: Single batch query for ALL creator thumbnails instead of N+1 per-creator queries
    let creatorsWithProjects = [];
    if ((gridCreators || []).length > 0) {
      const gridIds = gridCreators.map(c => c.id);
      const { data: allGridProjects } = await supabase
        .from('projects')
        .select('user_id, id, cover_url, thumbnail_url, title, category')
        .in('user_id', gridIds)
        .eq('published', true)
        .order('created_at', { ascending: false });

      // Group by user_id (max 5 per creator) in JavaScript
      const projectsByUser = {};
      (allGridProjects || []).forEach(p => {
        if (!projectsByUser[p.user_id]) projectsByUser[p.user_id] = [];
        if (projectsByUser[p.user_id].length < 5) projectsByUser[p.user_id].push(p);
      });

      creatorsWithProjects = gridCreators.map(creator => ({
        ...creator,
        sampleProjects: projectsByUser[creator.id] || [],
      }));
    }

    payload.designers = creatorsWithProjects;

    // 4. Cache response in Redis for 10 seconds (Only Page 1)
    if (page === 1) {
      try {
        await redis.setex(cacheKey, 10, payload);
      } catch (err) {
        console.error('[Redis Cache SET Error]', err);
      }
    }

    return NextResponse.json({ ...payload, cached: false }, { headers: CACHE_HEADERS });

  } catch (err) {
    console.error('[GET /api/designers Error]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
