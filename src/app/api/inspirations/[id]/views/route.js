import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'edge';

// ── POST: Increment inspiration view count (Atomic & Safe) ─────────────────────────────
export async function POST(request, { params }) {
  try {
    const { id } = params;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Invalid inspiration ID' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    // ROBUST FIX: Use the RPC function created in views_tracking_migration.sql
    // This is safe for concurrent users - Postgres handles the increment atomically
    const { data, error } = await supabase
      .rpc('increment_inspiration_view', { i_id: id });

    if (error) {
      console.error('View tracking failed:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to track view' }, 
        { status: 500 }
      );
    }

    // `data` from the RPC is directly the integer count
    return NextResponse.json({ success: true, views: typeof data === 'number' ? data : 0 });

  } catch (err) {
    console.error('[POST /api/inspirations/[id]/views Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
