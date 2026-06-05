import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redis } from '@/lib/redis';

export const runtime = 'edge';

export async function POST(req) {
  try {
    const { projectId } = await req.json();
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });

    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const cacheKey = `view_${projectId}_${ip}`;
    
    // Prevent spamming views from the same IP (1 view per project per IP per hour)
    const hasViewed = await redis.get(cacheKey);
    if (hasViewed) {
      return NextResponse.json({ success: true, cached: true });
    }
    
    await redis.setex(cacheKey, 3600, '1');

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { error } = await supabase.rpc('increment_project_view', { p_id: projectId });
    if (error) {
      // Fallback if RPC is missing
      await supabase
        .from('projects')
        .update({ views_count: supabase.raw('views_count + 1') })
        .eq('id', projectId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // Suppress console spam for view tracking
    return NextResponse.json({ success: false, reason: error.message }, { status: 200 });
  }
}
