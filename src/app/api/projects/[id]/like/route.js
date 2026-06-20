import { NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/supabase/server';
import { redis } from '@/lib/redis';
import { invalidateOnPublish } from '@/lib/cacheKeys';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { action } = await request.json(); // 'like' or 'unlike'

    const { user, admin: supabaseAdmin } = await getServerAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (action === 'like') {
      const { error: insertError } = await supabaseAdmin
        .from('project_likes')
        .insert({ user_id: user.id, project_id: id });

      if (insertError && insertError.code !== '23505') { // Ignore unique constraint violation
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    } else {
      const { error: deleteError } = await supabaseAdmin
        .from('project_likes')
        .delete()
        .eq('user_id', user.id)
        .eq('project_id', id);

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }
    }

    // Targeted cache invalidation
    try {
      const { data: projectData } = await supabaseAdmin.from('projects').select('category').eq('id', id).single();
      await invalidateOnPublish(redis, { category: projectData?.category });
    } catch (cacheErr) {
      console.error('[Redis Cache Invalidate Error]:', cacheErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[POST /api/projects/[id]/like Error]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
