import { NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/supabase/server';
import { redis } from '@/lib/redis';

const ALLOWED_KEY_PREFIXES = [
  'profile_data_v2:',
  'profile_data:',
  'projects_v2:',
  'trending_',
  'search_v2:',
  'designers_feed:',
];

function isAllowedKey(key) {
  if (typeof key !== 'string' || !key) return false;
  return ALLOWED_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
}

export async function POST(request) {
  try {
    const { user, admin } = await getServerAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Only admins can flush cache keys
    const { data: profile } = await admin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { keys } = await request.json();
    if (!Array.isArray(keys) || keys.length === 0) {
      return NextResponse.json({ error: 'Invalid keys' }, { status: 400 });
    }

    const rejected = keys.filter((key) => !isAllowedKey(key));
    if (rejected.length > 0) {
      return NextResponse.json({ error: 'Forbidden key(s)', rejected }, { status: 403 });
    }

    for (const key of keys) {
      await redis.del(key);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to clear cache' }, { status: 500 });
  }
}
