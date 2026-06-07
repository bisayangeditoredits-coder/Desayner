import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req) {
  try {
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
