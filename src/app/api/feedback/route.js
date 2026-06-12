import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'edge';
const CACHE_HEADERS = { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' };

// ── GET: Fetch feedback requests (cursor-based pagination) ──────────────
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const status = searchParams.get('status') || 'all';
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    let query = supabase
      .from('feedback_requests')
      .select('*, profiles!feedback_requests_user_id_fkey(username, full_name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(limit + 1);

    if (status !== 'all') {
      query = query.eq('status', status);
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

    // Resolve current user
    const { data: { user } } = await supabase.auth.getUser();

    return NextResponse.json({
      feedback: items,
      nextCursor,
      hasMore,
    }, { headers: CACHE_HEADERS });
  } catch (err) {
    console.error('[GET /api/feedback Error]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST: Create a feedback request ─────────────────────────────────────
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
    const { title, description, image_url, thumbnail_url, feedback_type } = body;

    if (!title || !image_url) {
      return NextResponse.json({ error: 'Title and image are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('feedback_requests')
      .insert({
        user_id: user.id,
        title,
        description: description || '',
        image_url,
        thumbnail_url: thumbnail_url || null,
        feedback_type: feedback_type || [],
      })
      .select('*, profiles!feedback_requests_user_id_fkey(username, full_name, avatar_url)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ feedback: data });
  } catch (err) {
    console.error('[POST /api/feedback Error]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
