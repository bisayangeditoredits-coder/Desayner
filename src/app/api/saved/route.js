import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { PROJECT_LIST_SELECT } from '@/lib/projectSearch';

const PAGE_SIZE = 24;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const collectionId = searchParams.get('collectionId');
    const offset = (page - 1) * PAGE_SIZE;

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll() } },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (collectionId) {
      const { data: collection, error: colError } = await supabase
        .from('collections')
        .select('id')
        .eq('id', collectionId)
        .eq('user_id', user.id)
        .single();

      if (colError || !collection) {
        return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
      }

      const { data, count, error } = await supabase
        .from('collection_items')
        .select(`projects(${PROJECT_LIST_SELECT})`, { count: 'exact' })
        .eq('collection_id', collectionId)
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) throw error;

      return NextResponse.json({
        projects: (data || []).map((r) => r.projects).filter(Boolean),
        hasMore: offset + PAGE_SIZE < (count || 0),
        total: count || 0,
      });
    }

    const { data, count, error } = await supabase
      .from('project_saves')
      .select(`projects(${PROJECT_LIST_SELECT})`, { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw error;

    return NextResponse.json({
      projects: (data || []).map((r) => r.projects).filter(Boolean),
      hasMore: offset + PAGE_SIZE < (count || 0),
      total: count || 0,
    });
  } catch (err) {
    console.error('[GET /api/saved]', err);
    return NextResponse.json({ error: 'Failed to fetch saved projects' }, { status: 500 });
  }
}
