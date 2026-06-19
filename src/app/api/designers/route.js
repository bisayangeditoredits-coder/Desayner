import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { swrCache } from '@/lib/cache';

export const runtime = 'edge';
const CACHE_HEADERS = { 'Cache-Control': 's-maxage=10, stale-while-revalidate=30' };

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'All';
    const sort = searchParams.get('sort') || 'followers';
    // Clamp page to prevent malicious large-offset DB scans
    const page = Math.min(Math.max(parseInt(searchParams.get('page') || '1', 10), 1), 500);
    const PAGE_SIZE = 24;


    const cacheKey = `designers_feed:${category}:${sort}:${page}`;

    const fetcher = async () => {
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        { cookies: { getAll: () => cookieStore.getAll() } }
      );

      let payload = {
        heroDesigner: null,
        featuredDesigners: [],
        risingDesigners: [],
        designers: [],
      };

      if (page === 1 && category === 'All') {
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

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { data: risingData } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, bio, followers_count, projects_count, tools, created_at, available_for_work')
          .gte('created_at', thirtyDaysAgo.toISOString())
          .order('followers_count', { ascending: false })
          .limit(4);
          
        if (risingData && risingData.length > 0) {
          const risingIds = risingData.map(c => c.id);
          const { data: risingProjects } = await supabase
            .from('projects')
            .select('user_id, id, cover_url, thumbnail_url, title')
            .in('user_id', risingIds)
            .eq('published', true)
            .order('created_at', { ascending: false });

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

      let selectString = 'id, username, full_name, avatar_url, bio, location, followers_count, following_count, projects_count, created_at, tools, available_for_work';
      if (category !== 'All') {
        selectString += ', projects!inner(user_id, category, published)';
      }

      let query = supabase
        .from('profiles')
        .select(selectString)
        .not('username', 'is', null)
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      if (category !== 'All') {
        query = query
          .eq('projects.category', category)
          .eq('projects.published', true);
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

      let creatorsWithProjects = [];
      if ((gridCreators || []).length > 0) {
        const gridIds = gridCreators.map(c => c.id);
        const { data: allGridProjects } = await supabase
          .from('projects')
          .select('user_id, id, cover_url, thumbnail_url, title, category')
          .in('user_id', gridIds)
          .eq('published', true)
          .order('created_at', { ascending: false });

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
      return payload;
    };

    const { data: payload, cached } = await swrCache(cacheKey, 30, fetcher);

    return NextResponse.json({ ...payload, cached }, { headers: CACHE_HEADERS });

  } catch (err) {
    console.error('[GET /api/designers Error]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
