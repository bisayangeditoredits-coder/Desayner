import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redis } from '@/lib/redis';
import * as Sentry from '@sentry/nextjs';

export const runtime = 'edge';

/**
 * GET /api/messages?conversationId=X&cursor=Y&limit=30
 * Fetches paginated messages for a conversation.
 *
 * POST /api/messages
 * Body: { conversationId, body?, imageUrl? }
 * Sends a message. Rate-limited to 30/min per user.
 */

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
}

export async function GET(request) {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const cursor = searchParams.get('cursor');     // ISO timestamp
    const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 50);

    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId required' }, { status: 400 });
    }

    // Verify user is a participant (RLS handles this, but explicit check is cleaner)
    const { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .maybeSingle();

    if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    let query = supabase
      .from('messages')
      .select('id, sender_id, body, image_url, seen, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit + 1); // fetch one extra to detect hasMore

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data: rows, error } = await query;
    if (error) throw error;

    const hasMore = rows.length > limit;
    const messages = hasMore ? rows.slice(0, limit) : rows;
    // Return in ascending order for rendering
    messages.reverse();

    const nextCursor = hasMore ? messages[0]?.created_at : null;

    return NextResponse.json({ messages, nextCursor, hasMore });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

import { Ratelimit } from '@upstash/ratelimit';

// 30 messages per minute per user
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '60 s'),
  analytics: false,
  prefix: 'rl:msg',
});

export async function POST(request) {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Rate limit: 30 messages per minute (atomic sliding window via Lua script)
    const { success, remaining } = await ratelimit.limit(`user:${user.id}`);
    if (!success) {
      return NextResponse.json(
        { error: 'Too many messages. Please slow down.' }, 
        { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
      );
    }

    const { conversationId, body, imageUrl } = await request.json();

    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId required' }, { status: 400 });
    }
    if (!body?.trim() && !imageUrl) {
      return NextResponse.json({ error: 'Message body or image required' }, { status: 400 });
    }
    if (body && body.length > 2000) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 });
    }

    // Verify participant
    const { data: conv } = await supabase
      .from('conversations')
      .select('id, user1_id, user2_id')
      .eq('id', conversationId)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .maybeSingle();

    if (!conv) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });

    // Insert message
    const { data: msg, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        body: body?.trim() || null,
        image_url: imageUrl || null,
      })
      .select('id, sender_id, body, image_url, seen, created_at')
      .single();

    if (msgError) throw msgError;

    // Update conversation last_msg and last_msg_at
    const snippet = body?.trim()
      ? body.trim().slice(0, 80)
      : '📷 Image';

    await supabase
      .from('conversations')
      .update({ last_msg: snippet, last_msg_at: msg.created_at })
      .eq('id', conversationId);

    // Increment unread count for the OTHER user
    const recipientId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id;
    await supabase.rpc('increment_unread', {
      p_conv_id: conversationId,
      p_user_id: recipientId,
    });

    return NextResponse.json({ message: msg });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
