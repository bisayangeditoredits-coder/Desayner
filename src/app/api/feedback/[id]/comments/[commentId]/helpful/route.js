import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'edge';

// ── POST: Toggle helpful mark on a comment ──────────────────────────────
export async function POST(request, { params }) {
  try {
    const { id, commentId } = await params;

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if already marked as helpful
    const { data: existing } = await supabase
      .from('feedback_helpful')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      // Remove helpful mark
      const { error } = await supabase
        .from('feedback_helpful')
        .delete()
        .eq('id', existing.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ helpful: false });
    } else {
      // Add helpful mark
      const { error } = await supabase
        .from('feedback_helpful')
        .insert({
          comment_id: commentId,
          user_id: user.id,
        });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ helpful: true });
    }
  } catch (err) {
    console.error('[POST /api/feedback/[id]/comments/[commentId]/helpful Error]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}