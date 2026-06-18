import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { Resend } from 'resend';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Upstash Redis for Rate Limiting (Max 3 inquiries per hour)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});
const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(3, "1 h"),
});

export async function POST(request) {
  try {
    const { receiver_id, projectType, budget, engagementType, message, turnstileToken } = await request.json();

    if (!receiver_id || !projectType || !message || !turnstileToken) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // --- 1. STRICT CONTENT VALIDATION ---
    if (message.length < 50) {
      return NextResponse.json({ error: 'Message is too short. Please provide at least 50 characters describing your project.' }, { status: 400 });
    }
    
    // Block URLs/Links to prevent phishing
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;
    if (urlRegex.test(message)) {
      return NextResponse.json({ error: 'For security reasons, links (URLs) are not allowed in the initial inquiry message.' }, { status: 400 });
    }

    // --- 2. CLOUDFLARE TURNSTILE VERIFICATION ---
    const turnstileVerify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${process.env.TURNSTILE_SECRET_KEY}&response=${turnstileToken}`,
    });
    const turnstileResult = await turnstileVerify.json();
    if (!turnstileResult.success) {
      return NextResponse.json({ error: 'Failed security challenge. Are you a bot?' }, { status: 403 });
    }

    // --- 3. SUPABASE AUTH & VERIFICATION ---
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. You must be logged in to send an inquiry.' }, { status: 401 });
    }

    // Require verified email (Anti-Troll Measure)
    if (!user.email_confirmed_at) {
      return NextResponse.json({ error: 'Your email address must be verified before you can send inquiries.' }, { status: 403 });
    }

    if (user.id === receiver_id) {
      return NextResponse.json({ error: 'You cannot send an inquiry to yourself.' }, { status: 400 });
    }

    // --- 4. UPSTASH RATE LIMITING ---
    const { success: rateLimitSuccess } = await ratelimit.limit(`inquiry_${user.id}`);
    if (!rateLimitSuccess) {
      return NextResponse.json({ error: 'You have reached the maximum number of inquiries (3 per hour). Please try again later.' }, { status: 429 });
    }

    // --- 5. DATABASE INSERT ---
    const fullMessage = `Engagement: ${engagementType || 'Project-based'}\n\n${message}`;
    const { error: insertError } = await supabase
      .from('inquiries')
      .insert({
        sender_id: user.id,
        receiver_id: receiver_id,
        project_type: projectType,
        budget: budget,
        message: fullMessage,
        status: 'unread'
      });

    if (insertError) {
      console.error('[Inquiries POST DB Error]', insertError);
      return NextResponse.json({ error: 'Database error. Please make sure the inquiries table is created.' }, { status: 500 });
    }

    // --- 6. EMAIL NOTIFICATION WITH SCAM WARNING ---
    if (process.env.RESEND_API_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // Use Admin Client to securely fetch the real registered email of the receiver
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const { data: receiverAuth } = await supabaseAdmin.auth.admin.getUserById(receiver_id);
      const receiverEmail = receiverAuth?.user?.email;

      const { data: senderProfile } = await supabase.from('profiles').select('full_name, username').eq('id', user.id).single();

      if (receiverEmail) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const senderName = senderProfile?.full_name || senderProfile?.username || 'A user';
        const senderEmail = user.email; // We have the sender's real email from the session

        try {
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'noreply@desayner.com',
            to: receiverEmail,
            subject: `New Inquiry from ${senderName} on Desayner!`,
            html: `
              <div style="background-color: #fff3cd; color: #856404; padding: 12px; border: 1px solid #ffeeba; border-radius: 4px; margin-bottom: 20px;">
                <strong>🚨 Anti-Scam Notice:</strong> Never share your passwords or click suspicious links. Always verify the client before starting work or sending files. If this message looks like a scam, please ignore it.
              </div>
              <h2>You have a new inquiry!</h2>
              <p><strong>From:</strong> ${senderName} (${senderEmail})</p>
              <p><strong>Project Type:</strong> ${projectType}</p>
              <p><strong>Engagement:</strong> ${engagementType || 'Project-based'}</p>
              <p><strong>Budget:</strong> ${budget}</p>
              <hr/>
              <p><strong>Message:</strong></p>
              <p style="white-space: pre-wrap;">${message}</p>
              <hr/>
              <p><em>Reply to this user by reaching out to their email or finding them on Desayner.</em></p>
            `,
          });
        } catch (emailErr) {
          console.error('[Inquiries POST Email Error]', emailErr);
        }
      }
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('[Inquiries POST Error]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
