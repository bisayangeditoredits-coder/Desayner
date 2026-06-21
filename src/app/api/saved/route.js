import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { PROJECT_LIST_SELECT } from '@/lib/projectSearch';

const PAGE_SIZE = 24;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page         = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const collectionId = searchParams.get('collectionId');
    const offset       = (page - 1) * PAGE_SIZE;

    // 1. Verify identity (anon key + session cookies from request)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => request.cookies.getAll() } },
    );
    const { data: authData, error: authError } = await supabase.auth.getUser();
    const user = authData?.user;
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. All DB reads via service role — bypasses RLS
    const admin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { cookies: { getAll: () => [], setAll: () => {} } },
    );

    // ── Helper: fetch project rows from an array of IDs, preserving order ──
    async function fetchProjectsByIds(ids) {
      if (!ids || ids.length === 0) return [];
      const { data, error } = await admin
        .from('projects')
        .select(PROJECT_LIST_SELECT)
        .in('id', ids);
      if (error) throw error;
      // Re-sort to match the original save-order
      const map = Object.fromEntries((data || []).map((p) => [p.id, p]));
      return ids.map((id) => map[id]).filter(Boolean);
    }

    // ── Collection-filtered view ────────────────────────────────────────────
    if (collectionId) {
      // Verify the collection belongs to this user
      const { data: collection, error: colError } = await admin
        .from('collections')
        .select('id')
        .eq('id', collectionId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (colError) throw colError;
      if (!collection) {
        return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
      }

      // Step A: get saved project_ids (paginated, in save order)
      const { data: items, count, error: itemsError } = await admin
        .from('collection_items')
        .select('project_id', { count: 'exact' })
        .eq('collection_id', collectionId)
        .not('project_id', 'is', null)
        .range(offset, offset + PAGE_SIZE - 1);

      if (itemsError) throw itemsError;

      const ids = (items || []).map((r) => r.project_id).filter(Boolean);

      // Step B: fetch project rows by id
      const projects = await fetchProjectsByIds(ids);

      return NextResponse.json({
        projects,
        hasMore: offset + PAGE_SIZE < (count || 0),
        total:   count || 0,
      });
    }

    // ── All-saves view ──────────────────────────────────────────────────────
    const { data: saves, count, error: savesError } = await admin
      .from('project_saves')
      .select('project_id', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (savesError) throw savesError;

    const ids = (saves || []).map((r) => r.project_id).filter(Boolean);
    const projects = await fetchProjectsByIds(ids);

    return NextResponse.json({
      projects,
      hasMore: offset + PAGE_SIZE < (count || 0),
      total:   count || 0,
    });
  } catch (err) {
    console.error('[GET /api/saved]', err);
    return NextResponse.json({ error: 'Failed to fetch saved projects' }, { status: 500 });
  }
}
