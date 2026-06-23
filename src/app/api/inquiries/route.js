import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { getServerAuth } from '@/lib/supabase/server';
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
  analytics: false,
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
    const { user, admin } = await getServerAuth(request);

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
    const { error: insertError } = await admin
      .from('inquiries')
      .insert({
        sender_id:    user.id,
        receiver_id:  receiver_id,
        project_type: projectType,
        budget:       budget,
        message:      fullMessage,
        status:       'unread'
      });

    if (insertError) {
      console.error('[Inquiries POST DB Error]', insertError);
      return NextResponse.json({ error: 'Database error. Please make sure the inquiries table is created.' }, { status: 500 });
    }

    // --- 6. EMAIL NOTIFICATION WITH SCAM WARNING ---
    if (process.env.RESEND_API_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const { data: receiverAuth } = await supabaseAdmin.auth.admin.getUserById(receiver_id);
      const receiverEmail = receiverAuth?.user?.email;

      const { data: senderProfile } = await admin.from('profiles').select('full_name, username').eq('id', user.id).maybeSingle();

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
              <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; color: #0f172a;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);">
                  
                  <div style="background-color: #0f172a; padding: 30px; text-align: center;">
                    <img src="${process.env.NEXT_PUBLIC_APP_URL || 'https://desayner.com'}/desayner-logo-white.png" alt="Desayner" style="height: 32px; width: auto; margin: 0 auto; display: block;" />
                    <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 15px;">You have a new inquiry!</p>
                  </div>

                  <div style="padding: 30px;">
                    <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                      <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.5;">
                        <strong style="color: #b45309;">🚨 Anti-Scam Notice:</strong> Never share your passwords or click suspicious links. Always verify the client before starting work or sending files. If this message looks like a scam, please ignore it.
                      </p>
                    </div>

                    <div style="margin-bottom: 24px;">
                      <p style="margin: 0 0 16px 0; font-size: 16px;">
                        <strong>Hi there,</strong><br>
                        <span style="color: #475569;">${senderName} sent you a project inquiry via Desayner.</span>
                      </p>
                      
                      <table style="width: 100%; border-collapse: collapse; background-color: #f8fafc; border-radius: 12px; overflow: hidden;">
                        <tr>
                          <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; width: 35%; color: #64748b; font-size: 14px;">Client Name</td>
                          <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; font-weight: 500;">${senderName}</td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">Project Type</td>
                          <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; font-weight: 500;">${projectType}</td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">Engagement</td>
                          <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; font-weight: 500;">${engagementType || 'Project-based'}</td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 16px; color: #64748b; font-size: 14px;">Budget</td>
                          <td style="padding: 12px 16px; font-size: 14px; font-weight: 500; color: #059669;">${budget}</td>
                        </tr>
                      </table>
                    </div>

                    <div style="margin-bottom: 30px;">
                      <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; margin: 0 0 12px 0;">Message</h3>
                      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;">
                        <p style="margin: 0; white-space: pre-wrap; font-size: 15px; line-height: 1.6; color: #334155;">${message}</p>
                      </div>
                    </div>

                    <div style="text-align: center; margin-top: 30px;">
                      <a href="mailto:${senderEmail}?subject=Re: Your Inquiry on Desayner" style="display: inline-block; background-color: #2d43e8; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                        Reply to ${senderName}
                      </a>
                      <p style="margin-top: 16px; font-size: 13px; color: #94a3b8;">
                        Or reply directly to: <a href="mailto:${senderEmail}" style="color: #2d43e8; text-decoration: none;">${senderEmail}</a>
                      </p>
                    </div>

                  </div>
                </div>
                
                <div style="text-align: center; margin-top: 24px;">
                  <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                    This email was sent by Desayner on behalf of a user.<br>
                    Please verify the sender before exchanging sensitive information.
                  </p>
                </div>
              </div>
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
