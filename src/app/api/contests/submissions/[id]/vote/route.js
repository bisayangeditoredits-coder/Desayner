import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'edge';

export async function POST(request, { params }) {
  try {
    const { id: submissionId } = await params;
    const { action } = await request.json(); // 'vote' or 'unvote'
    
    const cookieStore = await cookies();
    
    // 1. Authenticate user
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Perform the Insert or Delete using Service Role to bypass RLS
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => [] } }
    );

    // Fetch the parent contest to check status
    const { data: submission } = await supabaseAdmin.from('contest_submissions').select('contest_id').eq('id', submissionId).single();
    if (!submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });

    const { data: contest } = await supabaseAdmin.from('contests').select('status, is_voting_closed').eq('id', submission.contest_id).single();
    if (!contest || contest.status !== 'active' || contest.is_voting_closed) {
      return NextResponse.json({ error: 'Voting is currently closed for this contest.' }, { status: 400 });
    }

    if (action === 'vote') {
      const { error: insertError } = await supabaseAdmin
        .from('contest_votes')
        .insert({ user_id: user.id, submission_id: submissionId });
        
      if (insertError && insertError.code !== '23505') { // Ignore unique constraint violation
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    } else {
      // Unvoting is strictly disabled now
      return NextResponse.json({ error: 'Unvoting is not allowed.' }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[POST /api/contests/submissions/[id]/vote Error]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
