import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { redis } from '@/lib/redis';

// Keep as edge but use request.cookies — compatible with Edge Runtime
export const runtime = 'edge';

// Validate IP format to prevent header-spoofed rate-limit bypass
function sanitizeIP(ip) {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^[\da-f:]+$/i;
  if (!ip) return 'unknown';
  const cleanedIp = ip.split(',')[0].trim();
  if (!ipv4Regex.test(cleanedIp) && !ipv6Regex.test(cleanedIp)) return 'unknown';
  return cleanedIp;
}

export async function POST(req) {
  try {
    const { projectId } = await req.json();
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });

    const ip = sanitizeIP(
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      'unknown'
    );
    const rateLimitKey = `view_${projectId}_ip_${ip}`;

    // 1 view per IP per hour per project
    const hasViewed = await redis.get(rateLimitKey);
    if (hasViewed) {
      return NextResponse.json({ success: true, cached: true });
    }

    await redis.setex(rateLimitKey, 3600, '1');

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll: () => [],
          setAll: () => {},
        },
      }
    );

    const { data, error } = await supabase
      .rpc('increment_project_view', { p_id: projectId });

    if (error) {
      console.error('View increment error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // NOTE: We intentionally do NOT invalidate feed caches here.
    // View counts are atomically incremented via RPC — the 60s SWR lag is acceptable.
    // Busting the entire feed cache on every view causes a perpetual cache stampede on
    // popular projects, effectively disabling caching entirely for hot content.
    // Feed cache is only invalidated by real mutations: publish, like, save, delete.

    return NextResponse.json({ success: true, views: typeof data === 'number' ? data : 0 });
  } catch (error) {
    return NextResponse.json({ success: false, reason: error.message }, { status: 200 });
  }
}
