/**
 * POST /api/community/posts/[id]/report
 * Flag a post. One report per user per post (PK enforced in DB).
 */
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';


const ALLOWED_REASONS = ['spam', 'harassment', 'misinformation', 'other'];

export async function POST(request, { params }) {
  try {
    const { id } = await params;

    // 1. Verify identity
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => request.cookies.getAll() } }
    );
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) return NextResponse.json({ error: 'Login to report.' }, { status: 401 });

    const body   = await request.json();
    const reason = ALLOWED_REASONS.includes(body.reason) ? body.reason : 'other';

    // 2. Insert with service role to bypass RLS
    const admin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );

    const { error } = await admin
      .from('community_post_reports')
      .insert({ post_id: id, user_id: user.id, reason });

    // 23505 = unique_violation (already reported) — treat as success
    if (error && error.code !== '23505') throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[POST /api/community/posts/[id]/report]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
