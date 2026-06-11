import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redis } from '@/lib/redis';

export const runtime = 'edge';

// SECURITY FIX: Improved IP validation and user-based rate limiting
function sanitizeIP(ip) {
  // Only accept valid IPv4 or IPv6 format
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^[\da-f:]+$/i;
  
  if (!ip) return 'unknown';
  
  // If multiple IPs, take the first (from x-forwarded-for)
  const cleanedIp = ip.split(',')[0].trim();
  
  // Validate IP format
  if (!ipv4Regex.test(cleanedIp) && !ipv6Regex.test(cleanedIp)) {
    return 'unknown';
  }
  
  return cleanedIp;
}

export async function POST(req) {
  try {
    const { projectId } = await req.json();
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    
    // Prefer authenticated user ID for rate limiting, fall back to IP
    let rateLimitKey;
    if (user?.id) {
      rateLimitKey = `view_${projectId}_user_${user.id}`;
    } else {
      const ip = sanitizeIP(req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown');
      rateLimitKey = `view_${projectId}_ip_${ip}`;
    }
    
    // Prevent spamming views — 1 view per user/IP per hour per project
    const hasViewed = await redis.get(rateLimitKey);
    if (hasViewed) {
      return NextResponse.json({ success: true, cached: true });
    }
    
    await redis.setex(rateLimitKey, 3600, '1'); // 1 hour

    // Increment views atomically using the RPC function created in the migration
    const { data, error } = await supabase
      .rpc('increment_project_view', { p_id: projectId });

    if (error) {
      console.error('View increment error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Invalidate first-page project feed caches (exact keys only — Redis DEL does not support globs)
    try {
      await redis.del(
        'projects:All:24:0',
        'trending_projects_top_10'
      );
    } catch (cacheErr) {
      console.warn('Cache invalidation failed:', cacheErr);
    }

    // `data` from the RPC is directly the integer count
    return NextResponse.json({ success: true, views: typeof data === 'number' ? data : 0 });
  } catch (error) {
    // Suppress console spam for view tracking
    return NextResponse.json({ success: false, reason: error.message }, { status: 200 });
  }
}
