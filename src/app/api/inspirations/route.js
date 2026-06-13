import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redis } from '@/lib/redis';
import { Ratelimit } from '@upstash/ratelimit';

// 10 inspiration posts per user per 60 seconds
const postRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '60 s'),
  analytics: false,
  prefix: 'rl:inspirations:post',
});

export const runtime = 'edge';

// ── GET: Fetch inspirations (Cursor-based) ───────────────────────────
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor   = searchParams.get('cursor'); // created_at ISO string
    const category = searchParams.get('category') || 'All';
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '15', 10), 1), 50);

    const cacheKey = `inspirations:${category}:${limit}`;

    // 1. If it's the first page (no cursor), read from Redis cache first
    if (!cursor) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          // Resolve current user liked state for cached items dynamically
          const cookieStore = await cookies();
          const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            { cookies: { getAll: () => cookieStore.getAll() } }
          );
          const { data: { user } } = await supabase.auth.getUser();
          
          const items = cached.inspirations || [];
          if (user && items.length > 0) {
            const inspirationIds = items.map(item => item.id);
            const { data: likedList } = await supabase
              .from('inspiration_likes')
              .select('inspiration_id')
              .eq('user_id', user.id)
              .in('inspiration_id', inspirationIds);

            const likedSet = new Set((likedList || []).map(l => l.inspiration_id));
            items.forEach(item => {
              item.user_liked = likedSet.has(item.id);
            });
          }

          return NextResponse.json({
            inspirations: items,
            nextCursor: cached.nextCursor,
            hasMore: cached.hasMore,
            cached: true,
          });
        }
      } catch (err) {
        console.error('[Redis Cache Read Error]:', err);
      }
    }

    // 2. Fetch from database
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    let query = supabase
      .from('inspirations')
      .select('*, profiles!inspirations_user_id_fkey(username, full_name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(limit + 1); // fetch 1 extra item to check if there is more

    if (category !== 'All') {
      query = query.eq('category', category);
    }

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const items = data || [];
    let hasMore = false;
    let nextCursor = null;

    if (items.length > limit) {
      hasMore = true;
      items.pop(); // Remove the extra item
      nextCursor = items[items.length - 1].created_at;
    }

    // 3. Resolve logged-in user's likes
    const { data: { user } } = await supabase.auth.getUser();
    if (user && items.length > 0) {
      const inspirationIds = items.map(item => item.id);
      const { data: likedList } = await supabase
        .from('inspiration_likes')
        .select('inspiration_id')
        .eq('user_id', user.id)
        .in('inspiration_id', inspirationIds);

      const likedSet = new Set((likedList || []).map(l => l.inspiration_id));
      items.forEach(item => {
        item.user_liked = likedSet.has(item.id);
      });
    }

    // 4. Save first page responses to Redis cache for 60 seconds
    if (!cursor) {
      try {
        await redis.setex(cacheKey, 60, {
          inspirations: items,
          nextCursor,
          hasMore,
        });
      } catch (err) {
        console.error('[Redis Cache Write Error]:', err);
      }
    }

    return NextResponse.json({
      inspirations: items,
      nextCursor,
      hasMore,
      cached: false,
    }, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=30' }
    });

  } catch (err) {
    console.error('[GET /api/inspirations Error]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST: Share inspiration ──────────────────────────────────────────
export async function POST(request) {
  try {
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

    // Rate limit — 10 posts per user per 60 seconds
    const { success: canPost, remaining } = await postRatelimit.limit(`user:${user.id}`);
    if (!canPost) {
      return NextResponse.json(
        { error: 'You are posting too fast. Please wait a moment.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
      );
    }

    const body = await request.json();
    const { title, description, category, image_url, thumbnail_url } = body;

    if (!image_url) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('inspirations')
      .insert({
        user_id: user.id,
        title,
        description,
        category: category || 'General',
        image_url,
        thumbnail_url,
      })
      .select('*, profiles!inspirations_user_id_fkey(username, full_name, avatar_url)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Invalidate Redis caches to reflect updates immediately
    try {
      await redis.del(`inspirations:${category}:15`);
      await redis.del(`inspirations:All:15`);
    } catch (err) {
      console.error('[Redis Cache Invalidate Error]:', err);
    }

    return NextResponse.json({ inspiration: data });

  } catch (err) {
    console.error('[POST /api/inspirations Error]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
