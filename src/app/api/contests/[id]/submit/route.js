import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'edge';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { title, description, imageUrl, contactEmail, contactPhone, socialLink } = await request.json();

    if (!title || !imageUrl || !contactEmail || !contactPhone || !socialLink) {
      return NextResponse.json({ error: 'Please fill all required fields including contact info.' }, { status: 400 });
    }

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

    // 2. Perform Insert using Service Role to bypass RLS issues (for secure writes)
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => [] } }
    );

    const { data: contest } = await supabaseAdmin.from('contests').select('max_entries, status').eq('id', id).single();
    
    if (!contest || contest.status !== 'active') {
      return NextResponse.json({ error: 'Contest is not active.' }, { status: 400 });
    }

    if (contest.max_entries) {
      const { count } = await supabaseAdmin.from('contest_submissions').select('*', { count: 'exact', head: true }).eq('contest_id', id);
      if (count >= contest.max_entries) {
        return NextResponse.json({ error: 'Entry limit reached for this contest.' }, { status: 400 });
      }
    }

    const { data: submission, error } = await supabaseAdmin
      .from('contest_submissions')
      .insert({
        contest_id: id,
        user_id: user.id,
        title,
        description,
        image_url: imageUrl,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        social_link: socialLink
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'You have already submitted an entry for this contest.' }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, submission });
  } catch (err) {
    console.error('[POST /api/contests/[id]/submit Error]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
