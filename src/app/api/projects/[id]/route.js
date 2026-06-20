import { NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/supabase/server';
import { redis } from '@/lib/redis';
import { invalidateOnPublish } from '@/lib/cacheKeys';

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const { user, admin } = await getServerAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch profile + project data for cache invalidation (verify ownership too)
    const [{ data: profile }, { data: project }] = await Promise.all([
      admin.from('profiles').select('username').eq('id', user.id).maybeSingle(),
      admin.from('projects').select('category, user_id').eq('id', id).maybeSingle(),
    ]);

    // Ownership check — enforce in JS since service role bypasses RLS
    if (!project) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }
    if (project.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const { error } = await admin
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

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
    console.error('[DELETE /api/projects/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
