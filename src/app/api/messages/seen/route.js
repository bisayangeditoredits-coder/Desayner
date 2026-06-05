import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import * as Sentry from '@sentry/nextjs';

export const runtime = 'edge';

/**
 * PATCH /api/messages/seen
 * Body: { conversationId }
 * Marks all messages in a conversation as seen for the current user.
 * Also resets unread_count in conversation_members.
 *
 * GET /api/messages/conversations
 * Fetches recent conversations list for the current user.
 */

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
}

export async function PATCH(request) {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { conversationId } = await request.json();
    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId required' }, { status: 400 });
    }

    // Mark unseen messages from others as seen
    await supabase
      .from('messages')
      .update({ seen: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id)
      .eq('seen', false);

    // Reset unread count
    await supabase
      .from('conversation_members')
      .update({ unread_count: 0, last_seen_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch conversations where user is user1 or user2, ordered by recency
    const { data: convs, error } = await supabase
      .from('conversations')
      .select(`
        id, last_msg, last_msg_at,
        user1:profiles!conversations_user1_id_fkey(id, username, full_name, avatar_url),
        user2:profiles!conversations_user2_id_fkey(id, username, full_name, avatar_url),
        conversation_members(unread_count, user_id)
      `)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('last_msg_at', { ascending: false })
      .limit(30);

    if (error) throw error;

    // Shape data: add `other` field and `unread` field
    const shaped = (convs || []).map(c => {
      const other = c.user1.id === user.id ? c.user2 : c.user1;
      const myMember = (c.conversation_members || []).find(m => m.user_id === user.id);
      return {
        id: c.id,
        last_msg: c.last_msg,
        last_msg_at: c.last_msg_at,
        other,
        unread: myMember?.unread_count || 0,
      };
    });

    return NextResponse.json({ conversations: shaped });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
