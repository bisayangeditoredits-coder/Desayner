/**
 * GET   /api/community/posts/[id]  — single post with comments
 * PATCH /api/community/posts/[id]  — soft-delete (author only)
 */
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { redis } from '@/lib/redis';
import { swrCache } from '@/lib/cache';
import { communityPostKey, communityFeedKey } from '@/lib/cacheKeys';


const COMMENT_SELECT =
  'id, body, parent_id, created_at, user_id, profiles!community_post_comments_user_id_fkey(username, full_name, avatar_url)';

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const cacheKey = communityPostKey(id);

    const fetcher = async () => {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        { cookies: { getAll: () => [], setAll: () => {} } }
      );

      const [postRes, commentsRes] = await Promise.all([
        supabase
          .from('community_posts')
          .select('*, profiles!community_posts_user_id_fkey(username, full_name, avatar_url)')
          .eq('id', id)
          .is('deleted_at', null)
          .single(),
        supabase
          .from('community_post_comments')
          .select(COMMENT_SELECT)
          .eq('post_id', id)
          .is('deleted_at', null)
          .order('created_at', { ascending: true })
          .limit(100),
      ]);

      if (postRes.error || !postRes.data) return null;
      return { post: postRes.data, comments: commentsRes.data || [] };
    };

    const { data } = await swrCache(cacheKey, 10, fetcher);

    if (!data) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30' },
    });
  } catch (err) {
    console.error('[GET /api/community/posts/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── PATCH — soft delete ───────────────────────────────────────────────────────

export async function PATCH(request, { params }) {
  let step = 'init';
  try {
    step = 'params';
    const { id } = await params;

    // ── 1. Verify the caller's identity (anon key + user session cookies) ──────
    step = 'supabase-client';
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
        },
      }
    );

    step = 'auth';
    const { data: authData, error: authError } = await supabase.auth.getUser();
    const user = authData?.user;
    if (authError) console.warn('[PATCH community] auth warn:', authError.message);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // ── 2. Check ownership using service role (reads every row, no RLS filter) ─
    //      We manually enforce the user_id === auth user constraint below.
    step = 'service-client';
    const admin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );

    step = 'ownership-check';
    const { data: post, error: selectError } = await admin
      .from('community_posts')
      .select('id, flair, user_id, deleted_at')
      .eq('id', id)
      .maybeSingle();

    if (selectError) {
      console.error('[PATCH community] select error:', selectError.message);
      return NextResponse.json({ error: selectError.message }, { status: 500 });
    }
    if (!post || post.deleted_at !== null) {
      return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
    }
    if (post.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    // ── 3. Soft-delete with service role (bypasses RLS — ownership already verified) ─
    step = 'update';
    const { error: updateError } = await admin
      .from('community_posts')
      .update({ deleted_at: new Date().toISOString(), title: '[deleted]', body: null })
      .eq('id', id);

    if (updateError) {
      console.error('[PATCH community] update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // ── 4. Bust caches ────────────────────────────────────────────────────────
    step = 'cache';
    try {
      await redis.del(
        communityPostKey(id),
        communityFeedKey('hot',    'all',       1),
        communityFeedKey('newest', 'all',       1),
        communityFeedKey('hot',    post.flair,  1),
        communityFeedKey('newest', post.flair,  1),
      );
    } catch (cacheErr) {
      console.error('[PATCH community] cache bust error:', cacheErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`[PATCH /api/community/posts/[id]] at step "${step}":`, err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

