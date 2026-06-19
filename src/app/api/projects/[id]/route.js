import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redis } from '@/lib/redis';
import { invalidateOnPublish } from '@/lib/cacheKeys';

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

    // 2. Fetch the author's username + the project's category in parallel
    //    so we can do targeted cache invalidation without two sequential round-trips.
    const [{ data: profile }, { data: project }] = await Promise.all([
      supabase.from('profiles').select('username').eq('id', user.id).single(),
      supabase.from('projects').select('category').eq('id', id).eq('user_id', user.id).single(),
    ]);

    // 3. Delete the project (RLS ensures users can only delete their own)
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 4. Targeted cache invalidation — only bust the affected category + profile cache.
    //    Does not wipe unrelated sort views or paginated pages beyond page 1.
    try {
      await invalidateOnPublish(redis, {
        category: project?.category,
        username: profile?.username,
      });
    } catch (err) {
      console.error('[Redis Cache Invalidate Error]:', err);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/projects/[id] Error]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
