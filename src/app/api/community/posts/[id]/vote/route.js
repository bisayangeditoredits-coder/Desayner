/**
 * POST   /api/community/posts/[id]/vote  — upvote (toggle on)
 * DELETE /api/community/posts/[id]/vote  — remove upvote (toggle off)
 */
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { redis } from '@/lib/redis';
import { communityPostKey } from '@/lib/cacheKeys';

/** Shared: verify caller identity and return (user, adminClient) */
async function getAuthAndAdmin(request) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll: () => request.cookies.getAll() } }
  );
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user ?? null;

  const admin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  return { user, admin };
}

// ── POST — upvote ─────────────────────────────────────────────────────────────

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { user, admin } = await getAuthAndAdmin(request);
    if (!user) return NextResponse.json({ error: 'Login to upvote.' }, { status: 401 });

    const { error } = await admin
      .from('community_post_votes')
      .insert({ post_id: id, user_id: user.id });

    // 23505 = unique_violation (already voted) — treat as success
    if (error && error.code !== '23505') throw error;

    try { await redis.del(communityPostKey(id)); } catch (_) {}

    return NextResponse.json({ success: true, voted: true });
  } catch (err) {
    console.error('[POST /api/community/posts/[id]/vote]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── DELETE — remove upvote ────────────────────────────────────────────────────

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const { user, admin } = await getAuthAndAdmin(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await admin
      .from('community_post_votes')
      .delete()
      .eq('post_id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    try { await redis.del(communityPostKey(id)); } catch (_) {}

    return NextResponse.json({ success: true, voted: false });
  } catch (err) {
    console.error('[DELETE /api/community/posts/[id]/vote]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
