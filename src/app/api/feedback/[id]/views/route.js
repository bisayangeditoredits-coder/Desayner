import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'edge';

// ── POST: Increment feedback view count (Atomic & Safe) ─────────────────
export async function POST(request, { params }) {
  try {
    const { id } = await params;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Invalid feedback ID' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    // Use RPC for atomic increment (safe for concurrent users)
    const { data, error } = await supabase
      .rpc('increment_feedback_view', { f_id: id });

    if (error) {
      console.error('View tracking failed:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to track view' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, views: typeof data === 'number' ? data : 0 });
  } catch (err) {
    console.error('[POST /api/feedback/[id]/views Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}