import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
  try {
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

    const { data, error } = await supabase
      .from('collections')
      .select('id, name, created_at, collection_items(count)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const collections = (data || []).map((c) => ({
      id: c.id,
      name: c.name,
      created_at: c.created_at,
      itemCount: c.collection_items?.[0]?.count ?? 0,
    }));

    return NextResponse.json({ collections });
  } catch (err) {
    console.error('[GET /api/saved/collections]', err);
    return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 });
  }
}
