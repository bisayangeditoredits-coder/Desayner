import { NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/supabase/server';
import { createRateLimit, Ratelimit, safeLimit } from '@/lib/rateLimit';
import { redis } from '@/lib/redis';

const saveRatelimit = createRateLimit({
  limiter: Ratelimit.slidingWindow(60, '60 s'),
  analytics: false,
  prefix: 'rl:unsplash:save',
});

export async function POST(request) {
  try {
    const { user, admin } = await getServerAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { success, remaining } = await safeLimit(saveRatelimit, `user:${user.id}`, {
      logPrefix: 'Unsplash Save RateLimit',
    });
    if (!success) {
      return NextResponse.json(
        { error: 'Too many save requests. Please wait a moment.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
      );
    }

    const { photo_id, photo_url, photographer_name } = await request.json();
    if (!photo_id) return NextResponse.json({ error: 'Missing photo ID' }, { status: 400 });

    const { data: existing } = await admin
      .from('saved_photos')
      .select('id')
      .eq('user_id', user.id)
      .eq('photo_id', photo_id)
      .maybeSingle();

    if (existing) {
      const { error } = await admin.from('saved_photos').delete().eq('id', existing.id);
      if (error) throw error;
      return NextResponse.json({ saved: false });
    }

    const { error } = await admin
      .from('saved_photos')
      .insert({ user_id: user.id, photo_id, photo_url, photographer_name });
    if (error) throw error;
    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error('[Save Photo Error]', error);
    return NextResponse.json({ error: 'Failed to save photo' }, { status: 500 });
  }
}