/**
 * GET  /api/community/posts  — paginated feed (cached, edge)
 * POST /api/community/posts  — create a post (auth required)
 */
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

import { redis } from '@/lib/redis';
import { swrCache } from '@/lib/cache';
import { communityFeedKey } from '@/lib/cacheKeys';


const PAGE_SIZE = 20;
const ALLOWED_SORTS = ['hot', 'newest', 'top'];
const ALLOWED_FLAIRS = ['all', 'general', 'question', 'help', 'feedback'];

const POST_SELECT =
  'id, title, body, link_url, image_url, flair, votes_count, comments_count, trending_score, is_pinned, created_at, user_id, profiles!community_posts_user_id_fkey(username, full_name, avatar_url)';

// ── GET — feed ───────────────────────────────────────────────────────────────

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sort  = ALLOWED_SORTS.includes(searchParams.get('sort'))  ? searchParams.get('sort')  : 'hot';
    const flair = ALLOWED_FLAIRS.includes(searchParams.get('flair')) ? searchParams.get('flair') : 'all';
    const page  = Math.min(Math.max(parseInt(searchParams.get('page') || '1', 10), 1), 500);

    const cacheKey = communityFeedKey(sort, flair, page);
    const offset   = (page - 1) * PAGE_SIZE;

    const fetcher = async () => {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        { cookies: { getAll: () => [], setAll: () => {} } }
      );

      let query = supabase
        .from('community_posts')
        .select(POST_SELECT)
        .is('deleted_at', null)
        .range(offset, offset + PAGE_SIZE - 1);

      if (flair !== 'all') query = query.eq('flair', flair);

      if (sort === 'hot')    query = query.order('is_pinned', { ascending: false }).order('trending_score', { ascending: false });
      if (sort === 'newest') query = query.order('is_pinned', { ascending: false }).order('created_at', { ascending: false });
      if (sort === 'top')    query = query.order('is_pinned', { ascending: false }).order('votes_count', { ascending: false }).order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    };

    const { data: posts, cached } = await swrCache(cacheKey, 30, fetcher);

    return NextResponse.json({ posts, cached, page, sort, flair }, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
    });
  } catch (err) {
    console.error('[GET /api/community/posts]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST — create ─────────────────────────────────────────────────────────────

export async function POST(request) {
  try {
    // 1. Verify identity via anon client + cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => request.cookies.getAll() } }
    );
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) return NextResponse.json({ error: 'You must be logged in to post.' }, { status: 401 });

    // Rate-limit: 1 post per 30 s per user
    const rlKey = `community_post_rl:${user.id}`;
    const exists = await redis.get(rlKey);
    if (exists) return NextResponse.json({ error: 'Please wait before posting again.' }, { status: 429 });

    const body = await request.json();
    const { title, body: postBody, link_url, image_url, flair } = body;

    if (!title || title.trim().length < 3) {
      return NextResponse.json({ error: 'Title must be at least 3 characters.' }, { status: 400 });
    }
    if (!postBody?.trim() && !image_url && !link_url) {
      return NextResponse.json({ error: 'Post must have a body, image, or link.' }, { status: 400 });
    }
    const safeFlair = ALLOWED_FLAIRS.includes(flair) && flair !== 'all' ? flair : 'general';

    // 2. Insert with service role to bypass RLS (user_id explicitly set = safe)
    const admin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );

    const { data: post, error: insertError } = await admin
      .from('community_posts')
      .insert({
        user_id:   user.id,
        title:     title.trim().slice(0, 300),
        body:      postBody?.trim() || null,
        link_url:  link_url?.trim() || null,
        image_url: image_url || null,
        flair:     safeFlair,
      })
      .select('id, title, flair, created_at')
      .single();

    if (insertError) throw insertError;

    // Set rate-limit key (30 s window)
    await redis.setex(rlKey, 30, '1');

    // Bust page-1 feed caches for all sorts
    await redis.del(
      communityFeedKey('hot', 'all', 1),
      communityFeedKey('newest', 'all', 1),
      communityFeedKey('hot', safeFlair, 1),
      communityFeedKey('newest', safeFlair, 1),
    );

    return NextResponse.json({ post }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/community/posts]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
