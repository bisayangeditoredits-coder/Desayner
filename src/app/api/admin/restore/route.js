import { NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/supabase/server';

// Whitelist of tables that can be restored (prevents SQL injection)
const ALLOWED_TABLES = ['projects', 'assets', 'inspirations', 'resources'];

export async function POST(req) {
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

    const { table, id } = await req.json();
    if (!table || !id) return NextResponse.json({ error: 'Missing table or id' }, { status: 400 });
    if (!ALLOWED_TABLES.includes(table)) return NextResponse.json({ error: 'Invalid table' }, { status: 400 });

    const { error } = await admin
      .from(table)
      .update({ deleted_at: null })
      .eq('id', id);

    if (error) {
      console.error('Restore error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Server error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
