import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q        = (searchParams.get('q') || '').trim();
  const category = searchParams.get('category') || '';
  const page     = parseInt(searchParams.get('page') || '1', 10);
  const limit    = 24;
  const offset   = (page - 1) * limit;

  if (!q) return NextResponse.json({ projects: [], total: 0 });

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  let query = supabase
    .from('projects')
    .select('*, profiles!projects_user_id_fkey(username, full_name, avatar_url)', { count: 'exact' })
    .eq('published', true)
    .textSearch('fts', q.split(/\s+/).join(' | '))
    .order('likes_count', { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) query = query.eq('category', category);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ projects: data || [], total: count || 0 });
}
