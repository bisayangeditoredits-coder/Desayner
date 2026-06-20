/**
 * GET  /api/community/posts/[id]/comments  — paginated comments
 * POST /api/community/posts/[id]/comments  — add a comment
 */
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { redis } from '@/lib/redis';
import { communityPostKey } from '@/lib/cacheKeys';


const COMMENT_SELECT =
  'id, body, parent_id, created_at, user_id, profiles!community_post_comments_user_id_fkey(username, full_name, avatar_url)';

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit  = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );

    const { data, error } = await supabase
      .from('community_post_comments')
      .select(COMMENT_SELECT)
      .eq('post_id', id)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({ comments: data || [] }, {
      headers: { 'Cache-Control': 'private, s-maxage=0' },
    });
  } catch (err) {
    console.error('[GET /api/community/posts/[id]/comments]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST — add comment ────────────────────────────────────────────────────────

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
    if (!user) return NextResponse.json({ error: 'Login to comment.' }, { status: 401 });

    const body      = await request.json();
    const text      = (body.body || '').trim();
    const parent_id = body.parent_id || null;

    if (!text || text.length < 1) {
      return NextResponse.json({ error: 'Comment cannot be empty.' }, { status: 400 });
    }
    if (text.length > 5000) {
      return NextResponse.json({ error: 'Comment is too long.' }, { status: 400 });
    }

    // 2. Insert with service role to bypass RLS
    const admin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );

    const { data: comment, error: insertError } = await admin
      .from('community_post_comments')
      .insert({ post_id: id, user_id: user.id, body: text, parent_id })
      .select(COMMENT_SELECT)
      .single();

    if (insertError) throw insertError;

    // Bust post detail cache (comments_count incremented via trigger)
    try { await redis.del(communityPostKey(id)); } catch (_) {}

    return NextResponse.json({ comment }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/community/posts/[id]/comments]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
