import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'edge';

// SECURITY FIX: Added authentication check
export async function GET(req) {
  try {
    // 1. Verify user is authenticated
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // 3. Fetch deleted items
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: projects, error: pErr } = await supabaseAdmin
      .from('projects')
      .select('id, title, deleted_at')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });

    const { data: assets, error: aErr } = await supabaseAdmin
      .from('assets')
      .select('id, title, deleted_at')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });

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
