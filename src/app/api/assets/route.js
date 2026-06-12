import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redis } from '@/lib/redis';

export const runtime = 'edge';
const CACHE_HEADERS = { 'Cache-Control': 's-maxage=10, stale-while-revalidate=30' };

// ── GET: Fetch assets (Cursor-based + Caching) ────────────────────────
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor   = searchParams.get('cursor'); // created_at ISO string
    const category = searchParams.get('category') || 'All';
    const limit    = parseInt(searchParams.get('limit') || '12', 10);

    const cacheKey = `assets:${category}:${limit}`;

    // 1. Read first page from cache
    if (!cursor) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          const cookieStore = await cookies();
          const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            { cookies: { getAll: () => cookieStore.getAll() } }
          );
          const { data: { user } } = await supabase.auth.getUser();

          const items = cached.assets || [];
          if (user && items.length > 0) {
            const assetIds = items.map(a => a.id);
            const { data: savedList } = await supabase
              .from('asset_saves')
              .select('asset_id')
              .eq('user_id', user.id)
              .in('asset_id', assetIds);

            const savedSet = new Set((savedList || []).map(s => s.asset_id));
            items.forEach(a => {
              a.user_saved = savedSet.has(a.id);
            });
          }

          return NextResponse.json({
            assets: items,
            nextCursor: cached.nextCursor,
            hasMore: cached.hasMore,
            cached: true,
          }, { headers: CACHE_HEADERS });
        }
      } catch (err) {
        console.error('[Redis Cache GET Error]:', err);
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
      .from('assets')
      .select('*, profiles!assets_user_id_fkey(username, full_name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(limit + 1);

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
      items.pop();
      nextCursor = items[items.length - 1].created_at;
    }

    // 3. Resolve logged-in user saves
    const { data: { user } } = await supabase.auth.getUser();
    if (user && items.length > 0) {
      const assetIds = items.map(a => a.id);
      const { data: savedList } = await supabase
        .from('asset_saves')
        .select('asset_id')
        .eq('user_id', user.id)
        .in('asset_id', assetIds);

      const savedSet = new Set((savedList || []).map(s => s.asset_id));
      items.forEach(a => {
        a.user_saved = savedSet.has(a.id);
      });
    }

    // 4. Save first page response to cache (expire in 10s)
    if (!cursor) {
      try {
        await redis.setex(cacheKey, 10, {
          assets: items,
          nextCursor,
          hasMore,
        });
      } catch (err) {
        console.error('[Redis Cache SET Error]:', err);
      }
    }

    return NextResponse.json({
      assets: items,
      nextCursor,
      hasMore,
      cached: false,
    }, { headers: CACHE_HEADERS });

  } catch (err) {
    console.error('[GET /api/assets Error]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST: Add asset listing ───────────────────────────────────────────
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

    const body = await request.json();
    const { title, description, thumbnail_url, preview_url, link, file_url, price, category } = body;

    if (!title || !category) {
      return NextResponse.json({ error: 'Title and Category are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('assets')
      .insert({
        user_id: user.id,
        title,
        description,
        thumbnail_url,
        preview_url,
        link,
        file_url,
        price: price || 'Free',
        category,
      })
      .select('*, profiles!assets_user_id_fkey(username, full_name, avatar_url)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Invalidate Redis caches
    try {
      await redis.del(`assets:${category}:12`);
      await redis.del(`assets:All:12`);
    } catch (err) {
      console.error('[Redis Cache Del Error]:', err);
    }

    return NextResponse.json({ asset: data });

  } catch (err) {
    console.error('[POST /api/assets Error]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── PATCH: Increment downloads count securely ─────────────────────────
export async function PATCH(request) {
  try {
    const cookieStore = await cookies();
    // Using service role client to bypass RLS and increment count
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const body = await request.json();
    const { assetId } = body;

    if (!assetId) {
      return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 });
    }

    // Read current count
    const { data: asset, error: fetchErr } = await supabase
      .from('assets')
      .select('downloads_count')
      .eq('id', assetId)
      .single();

    if (fetchErr || !asset) {
      return NextResponse.json({ error: fetchErr?.message || 'Asset not found' }, { status: 404 });
    }

    // Increment count
    const { data, error } = await supabase
      .from('assets')
      .update({ downloads_count: (asset.downloads_count || 0) + 1 })
      .eq('id', assetId)
      .select('id, downloads_count')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, downloads_count: data.downloads_count });

  } catch (err) {
    console.error('[PATCH /api/assets Error]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
