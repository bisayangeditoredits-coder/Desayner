import { NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/supabase/server';

export async function GET(req) {
  try {
    const { user, admin } = await getServerAuth(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Check if user is admin
    const { data: profile } = await admin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const [{ data: projects, error: pErr }, { data: assets, error: aErr }] = await Promise.all([
      admin.from('projects').select('id, title, deleted_at').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
      admin.from('assets').select('id, title, deleted_at').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
    ]);

    if (pErr || aErr) {
      console.error('Fetch error:', pErr || aErr);
      return NextResponse.json({ error: 'Failed to fetch deleted items' }, { status: 500 });
    }

    return NextResponse.json({ projects, assets });
  } catch (err) {
    console.error('Server error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
