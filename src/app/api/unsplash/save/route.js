import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@/lib/redis';

export const runtime = 'edge';

const saveRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '60 s'),
  analytics: false,
  prefix: 'rl:unsplash:save',
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
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { success, remaining } = await saveRatelimit.limit(`user:${user.id}`);
    if (!success) {
      return NextResponse.json(
        { error: 'Too many save requests. Please wait a moment.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
      );
    }

    const { photo_id, photo_url, photographer_name } = await request.json();

    if (!photo_id) {
      return NextResponse.json({ error: 'Missing photo ID' }, { status: 400 });
    }

    // Check if it's already saved
    const { data: existing } = await supabase
      .from('saved_photos')
      .select('id')
      .eq('user_id', user.id)
      .eq('photo_id', photo_id)
      .maybeSingle();

    if (existing) {
      // Unsave it
      const { error } = await supabase
        .from('saved_photos')
        .delete()
        .eq('id', existing.id);
        
      if (error) throw error;
      return NextResponse.json({ saved: false });
    } else {
      // Save it
      const { error } = await supabase
        .from('saved_photos')
        .insert({
          user_id: user.id,
          photo_id,
          photo_url,
          photographer_name
        });
        
      if (error) throw error;
      return NextResponse.json({ saved: true });
    }

  } catch (error) {
    console.error('[Save Photo Error]', error);
    return NextResponse.json({ error: 'Failed to save photo' }, { status: 500 });
  }
}
