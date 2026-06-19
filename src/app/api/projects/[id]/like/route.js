import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redis } from '@/lib/redis';
import { invalidateOnPublish } from '@/lib/cacheKeys';

export const runtime = 'edge';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { action } = await request.json(); // 'like' or 'unlike'
    
    const cookieStore = await cookies();
    
    // 1. Authenticate user
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Perform the Insert or Delete using Service Role to bypass RLS issues
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => [] } }
    );

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

    // 3. Targeted cache invalidation — only bust affected category first page
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
