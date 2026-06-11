import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redis } from '@/lib/redis';

export const runtime = 'edge';

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    // 1. Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch user's profile to get the username (for cache key)
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single();

    // 3. Delete the project (RLS ensures they only delete their own)
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 4. Invalidate Redis Caches
    try {
      if (profile?.username) {
        // Clear their profile cache so it updates instantly
        await redis.del(`profile_data:${profile.username.toLowerCase()}`);
      }
      // Also clear the trending/feed caches just in case
      await redis.del('trending_projects_top_10');
    } catch (err) {
      console.error('[Redis Cache Invalidate Error]:', err);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/projects/[id] Error]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
