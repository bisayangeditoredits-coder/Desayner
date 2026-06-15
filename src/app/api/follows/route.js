import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { waitUntil } from '@vercel/functions';
import { sendNewFollowerEmail } from '@/lib/emails';

export async function POST(req) {
  try {
    const { following_id } = await req.json();
    if (!following_id) {
      return NextResponse.json({ error: 'Missing following_id' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.id === following_id) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    // Use Service Role to bypass RLS
    const cookieStore = await cookies();
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => [] } }
    );

    // Insert follow
    const { error: insertError } = await supabaseAdmin
      .from('follows')
      .insert({
        follower_id: user.id,
        following_id: following_id,
      });

    // If already following, it might throw a unique constraint error, which is fine
    if (insertError && insertError.code !== '23505') {
      throw insertError;
    }

    // Send email notification asynchronously if it was a new follow
    if (!insertError) {
      waitUntil(
        (async () => {
          // Fetch follower details
          const { data: followerProfile } = await supabaseAdmin
            .from('profiles')
            .select('full_name, username')
            .eq('id', user.id)
            .single();

          if (followerProfile) {
            await sendNewFollowerEmail({
              targetUserId: following_id,
              followerName: followerProfile.full_name || followerProfile.username,
              followerUsername: followerProfile.username,
            });
          }
        })()
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API Follows POST]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { following_id } = await req.json();
    if (!following_id) {
      return NextResponse.json({ error: 'Missing following_id' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use Service Role to bypass RLS
    const cookieStore = await cookies();
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => [] } }
    );

    const { error: deleteError } = await supabaseAdmin
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', following_id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API Follows DELETE]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
