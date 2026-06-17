import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'edge';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => [] } }
    );

    // Fetch the contest and its submissions with user details and vote count
    const { data: contest, error } = await supabase
      .from('contests')
      .select(`
        *,
        contest_submissions (
          *,
          profiles (full_name, username, avatar_url),
          contest_votes (user_id)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    return NextResponse.json({ contest });
  } catch (err) {
    console.error('[GET /api/contests/[id] Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
