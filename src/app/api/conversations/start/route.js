import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redis } from '@/lib/redis';
import * as Sentry from '@sentry/nextjs';

export const runtime = 'edge';

/**
 * POST /api/conversations/start
 * Body: { recipientId: string }
 *
 * Finds or creates a 1:1 conversation. Idempotent — safe to call multiple times.
 * Rate limited to 10 new conversations per hour per user.
 */
import { Ratelimit } from '@upstash/ratelimit';

// Rate limit: 10 new conversation starts per hour per user
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  analytics: false,
  prefix: 'rl:conv_start',
});

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { recipientId } = await request.json();
    if (!recipientId || recipientId === user.id) {
      return NextResponse.json({ error: 'Invalid recipient' }, { status: 400 });
    }

    // Rate limit: 10 new conversation starts per hour (atomic sliding window via Lua script)
    const { success, remaining } = await ratelimit.limit(`user:${user.id}`);
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' }, 
        { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
      );
    }

    // Canonical ordering: smaller UUID first
    const user1_id = user.id < recipientId ? user.id : recipientId;
    const user2_id = user.id < recipientId ? recipientId : user.id;

    // Find existing or create new
    let { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('user1_id', user1_id)
      .eq('user2_id', user2_id)
      .maybeSingle();

    if (!conv) {
      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({ user1_id, user2_id })
        .select('id')
        .single();

      if (error) throw error;
      conv = newConv;

      // Create member rows for both participants
      await supabase.from('conversation_members').insert([
        { conversation_id: conv.id, user_id: user.id,      unread_count: 0 },
        { conversation_id: conv.id, user_id: recipientId,  unread_count: 0 },
      ]);
    }

    return NextResponse.json({ conversationId: conv.id });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
