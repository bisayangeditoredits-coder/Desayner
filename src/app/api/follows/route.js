import { NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/supabase/server';
import { waitUntil } from '@vercel/functions';
import { sendNewFollowerEmail } from '@/lib/emails';

export async function POST(req) {
  try {
    const { following_id } = await req.json();
    if (!following_id) {
      return NextResponse.json({ error: 'Missing following_id' }, { status: 400 });
    }

    const { user, admin: supabaseAdmin } = await getServerAuth(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (user.id === following_id) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

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

    const { user, admin: supabaseAdmin } = await getServerAuth(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
