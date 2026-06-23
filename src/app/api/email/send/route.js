import { NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/supabase/server';
import { sendWelcomeEmail } from '@/lib/email';
import { createRateLimit, Ratelimit, safeLimit } from '@/lib/rateLimit';
import { redis } from '@/lib/redis';

const emailRatelimit = createRateLimit({
  limiter: Ratelimit.slidingWindow(3, '1 h'),
  prefix: 'rl:email:send',
  analytics: false,
});

const ALLOWED_TYPES = ['welcome'];

export async function POST(request) {
  try {
    const { user, admin } = await getServerAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { success } = await safeLimit(emailRatelimit, `user:${user.id}`, {
      logPrefix: 'Email RateLimit',
    });
    if (!success) {
      return NextResponse.json({ error: 'Too many email requests. Try again later.' }, { status: 429 });
    }

    const body = await request.json();
    const { type } = body;

    if (!ALLOWED_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('full_name, username')
      .eq('id', user.id)
      .maybeSingle();

    if (type === 'welcome') {
      await sendWelcomeEmail({
        toEmail: user.email,
        toName: profile?.full_name || profile?.username || 'Designer',
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[POST /api/email/send]', err);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}