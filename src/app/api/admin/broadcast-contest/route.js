import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { Resend } from 'resend';

export const runtime = 'edge';

// NOTE: Make sure RESEND_API_KEY is in your .env.local
const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

export async function POST(request) {
  try {
    const { contestId, secret } = await request.json();

    // Basic protection so not just anyone can trigger the blast
    if (secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized - invalid admin secret' }, { status: 401 });
    }

    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => [] } }
    );

    // Fetch the contest details
    const { data: contest, error: contestError } = await supabaseAdmin
      .from('contests')
      .select('*')
      .eq('id', contestId)
      .single();

    if (contestError || !contest) {
      return NextResponse.json({ error: 'Contest not found' }, { status: 404 });
    }

    // Fetch all users from Supabase Auth
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) throw usersError;

    const emails = users.map(u => u.email).filter(Boolean);

    if (emails.length === 0) {
      return NextResponse.json({ error: 'No users found to email' }, { status: 400 });
    }

    // Prepare Resend batches
    const emailBatches = emails.map(email => ({
      from: 'Desayner Contests <hello@desayner.com>', // Change to your verified domain (e.g., contests@desayner.com) once verified
      to: [email],
      subject: `New Contest Alert: ${contest.title} - Win ${contest.prize}!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2d43e8;">🏆 New Design Contest</h1>
          <p>Hi there,</p>
          <p>We've just launched a brand new contest on Desayner: <strong>${contest.title}</strong>.</p>
          <p><strong>Prize:</strong> ${contest.prize}</p>
          <p>${contest.description}</p>
          <div style="margin-top: 30px; text-align: center;">
            <a href="https://desayner.com/contests/${contest.id}" style="background-color: #2d43e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              View Contest & Join
            </a>
          </div>
          <p style="margin-top: 40px; color: #888; font-size: 12px;">
            You are receiving this because you signed up on Desayner.
          </p>
        </div>
      `,
    }));

    // Resend allows sending up to 100 emails per batch request.
    const chunkSize = 100;
    for (let i = 0; i < emailBatches.length; i += chunkSize) {
      const chunk = emailBatches.slice(i, i + chunkSize);
      await resend.batch.send(chunk);
    }

    return NextResponse.json({ success: true, count: emails.length });
  } catch (err) {
    console.error('Email Broadcast Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to send emails' }, { status: 500 });
  }
}
