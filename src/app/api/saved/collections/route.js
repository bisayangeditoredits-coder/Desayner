import { NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/supabase/server';

export async function GET(request) {
  try {
    const { user, admin } = await getServerAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await admin
      .from('collections')
      .select('id, name, created_at, collection_items(count)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const collections = (data || []).map((c) => ({
      id:         c.id,
      name:       c.name,
      created_at: c.created_at,
      itemCount:  c.collection_items?.[0]?.count ?? 0,
    }));

    return NextResponse.json({ collections });
  } catch (err) {
    console.error('[GET /api/saved/collections]', err);
    return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 });
  }
}
