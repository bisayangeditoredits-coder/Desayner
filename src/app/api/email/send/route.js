import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { sendWelcomeEmail } from '@/lib/email';
import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@/lib/redis';

export const runtime = 'edge';

// Strict rate limit: 3 emails per user per hour
const emailRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 h'),
  prefix: 'rl:email:send',
});

const ALLOWED_TYPES = ['welcome'];

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    // Must be authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit per user
    const { success } = await emailRatelimit.limit(`user:${user.id}`);
    if (!success) {
      return NextResponse.json({ error: 'Too many email requests. Try again later.' }, { status: 429 });
    }

    const body = await request.json();
    const { type } = body;

    if (!ALLOWED_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
    }

    // Fetch profile for name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, username')
      .eq('id', user.id)
      .single();

    if (type === 'welcome') {
      await sendWelcomeEmail({
        toEmail: user.email,
        toName: profile?.full_name || profile?.username || 'Designer',
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[POST /api/email/send Error]:', err);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
