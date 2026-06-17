import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'edge';

export async function GET(request) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => [] } }
    );

    // Fetch all contests ordered by end_date descending
    const { data: contests, error } = await supabase
      .from('contests')
      .select('*')
      .order('end_date', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ contests });
  } catch (err) {
    console.error('[GET /api/contests Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
