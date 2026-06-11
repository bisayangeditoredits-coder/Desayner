import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'edge';

// ── GET: Fetch comments for a feedback request ──────────────────────────
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '30', 10);

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    let query = supabase
      .from('feedback_comments')
      .select('*, profiles!feedback_comments_user_id_fkey(username, full_name, avatar_url)')
      .eq('feedback_id', id)
      .is('parent_id', null) // Only top-level comments, replies are nested
      .order('created_at', { ascending: true })
      .limit(limit + 1);

    if (cursor) {
      query = query.gt('created_at', cursor);
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

    // Fetch replies for each comment
    const feedbackIds = items.map(c => c.id);
    let replies = [];
    if (feedbackIds.length > 0) {
      const { data: replyData } = await supabase
        .from('feedback_comments')
        .select('*, profiles!feedback_comments_user_id_fkey(username, full_name, avatar_url)')
        .in('parent_id', feedbackIds)
        .order('created_at', { ascending: true });

      replies = replyData || [];
    }

    // Attach replies to their parent comments
    const commentsWithReplies = items.map(comment => ({
      ...comment,
      replies: replies.filter(r => r.parent_id === comment.id),
    }));

    // Check if current user has marked any as helpful
    const { data: { user } } = await supabase.auth.getUser();
    let helpfulSet = new Set();
    if (user) {
      const allCommentIds = [
        ...items.map(c => c.id),
        ...replies.map(r => r.id),
      ];
      if (allCommentIds.length > 0) {
        const { data: helpfulData } = await supabase
          .from('feedback_helpful')
          .select('comment_id')
          .in('comment_id', allCommentIds)
          .eq('user_id', user.id);

        helpfulSet = new Set((helpfulData || []).map(h => h.comment_id));
      }
    }

    // Mark which comments the user found helpful
    const markHelpful = (comment) => ({
      ...comment,
      user_helpful: helpfulSet.has(comment.id),
    });

    return NextResponse.json({
      comments: commentsWithReplies.map(markHelpful).map(c => ({
        ...c,
        replies: c.replies.map(markHelpful),
      })),
      nextCursor,
      hasMore,
    });
  } catch (err) {
    console.error('[GET /api/feedback/[id]/comments Error]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST: Add a comment ─────────────────────────────────────────────────
export async function POST(request, { params }) {
  try {
    const { id } = await params;
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
    const { body: commentBody, parent_id } = body;

    if (!commentBody || !commentBody.trim()) {
      return NextResponse.json({ error: 'Comment body is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('feedback_comments')
      .insert({
        feedback_id: id,
        user_id: user.id,
        body: commentBody.trim(),
        parent_id: parent_id || null,
      })
      .select('*, profiles!feedback_comments_user_id_fkey(username, full_name, avatar_url)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Increment the comments count on the feedback request
    await supabase.rpc('increment_feedback_comments_count', { f_id: id });

    return NextResponse.json({ comment: data });
  } catch (err) {
    console.error('[POST /api/feedback/[id]/comments Error]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}