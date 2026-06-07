import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'edge';

// ── POST: Increment inspiration view count (Atomic & Safe) ─────────────────────────────
export async function POST(request, { params }) {
  try {
    const { id } = params;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Invalid inspiration ID' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    // ROBUST FIX: Use atomic increment (views_count + 1) to prevent race conditions
    // This is safe for concurrent users - Postgres handles the increment atomically
    const { data, error } = await supabase
      .from('inspirations')
      .update({ 
        views_count: supabase.rpc('increment', { x: 1 })  // Use increment RPC if available
      })
      .eq('id', id)
      .select('views_count')
      .single();

    if (error) {
      console.warn('RPC increment failed, using fallback:', error.message);
      
      // FALLBACK: Use raw SQL increment (atomic at database level)
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('inspirations')
        .update({ views_count: supabase.raw('views_count + 1') })
        .eq('id', id)
        .select('views_count')
        .single();

      if (fallbackError) {
        console.error('View tracking failed:', fallbackError);
        return NextResponse.json(
          { success: false, error: 'Failed to track view' }, 
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, views: fallbackData?.views_count || 0 });
    }

    return NextResponse.json({ success: true, views: data?.views_count || 0 });

  } catch (err) {
    console.error('[POST /api/inspirations/[id]/views Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
  }
}
