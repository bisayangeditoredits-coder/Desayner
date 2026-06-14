import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.RESEND_FROM_EMAIL || 'noreply@desayner.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://desayner.com';

/**
 * Send a welcome email to a new user after they complete onboarding.
 */
export async function sendWelcomeEmail({ toEmail, toName }) {
  return resend.emails.send({
    from: `Desayner <${FROM}>`,
    to: toEmail,
    subject: 'Welcome to Desayner 🎨',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Welcome to Desayner</title>
      </head>
      <body style="margin:0;padding:0;background:#231f20;font-family:'Inter','Segoe UI',sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#231f20;padding:40px 16px;">
          <tr>
            <td align="center">
              <table width="560" cellpadding="0" cellspacing="0" style="background:#111111;border-radius:16px;overflow:hidden;border:1px solid #222;">
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#2d43e8 0%,#231f20 100%);padding:40px 40px 32px;text-align:center;">
                    <img src="${APP_URL}/desayner-logo-whiteversiom.png" alt="Desayner" width="140" style="display:block;margin:0 auto 20px;" />
                    <h1 style="margin:0;font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.03em;">
                      Welcome, ${toName || 'Designer'}! 👋
                    </h1>
                    <p style="margin:10px 0 0;font-size:15px;color:rgba(255,255,255,0.7);">
                      Your Desayner account is ready.
                    </p>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:36px 40px;">
                    <p style="margin:0 0 20px;font-size:15px;color:#cbd5e1;line-height:1.7;">
                      You're now part of a creative community of designers — a place to showcase your work, get feedback, discover inspiration, and grow together.
                    </p>

                    <!-- Steps -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                      ${[
                        ['🖼️', 'Upload your first project', 'Share your portfolio with the community.'],
                        ['✨', 'Explore inspirations', 'Discover curated design work from fellow creators.'],
                        ['💬', 'Ask for feedback', 'Post your work and get constructive critique.'],
                        ['🔗', 'Find resources & assets', 'Browse free fonts, UI kits, and design tools.'],
                      ].map(([icon, title, desc]) => `
                        <tr>
                          <td style="padding:10px 0;border-bottom:1px solid #1e1e1e;">
                            <table cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="font-size:22px;padding-right:14px;vertical-align:top;padding-top:2px;">${icon}</td>
                                <td>
                                  <p style="margin:0;font-size:14px;font-weight:700;color:#f1f5f9;">${title}</p>
                                  <p style="margin:2px 0 0;font-size:13px;color:#64748b;">${desc}</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      `).join('')}
                    </table>

                    <!-- CTA -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <a href="${APP_URL}" style="display:inline-block;padding:14px 36px;background:#2d43e8;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:-0.01em;">
                            Go to Desayner →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:20px 40px;border-top:1px solid #1e1e1e;text-align:center;">
                    <p style="margin:0;font-size:12px;color:#475569;">
                      You received this email because you signed up at
                      <a href="${APP_URL}" style="color:#2d43e8;text-decoration:none;">desayner.com</a>.
                    </p>
                    <p style="margin:6px 0 0;font-size:12px;color:#334155;">
                      © ${new Date().getFullYear()} Desayner. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });
}

/**
 * Send a "someone liked your project" notification email.
 */
export async function sendLikeNotificationEmail({ toEmail, toName, likerName, projectTitle, projectUrl }) {
  return resend.emails.send({
    from: `Desayner <${FROM}>`,
    to: toEmail,
    subject: `${likerName} liked your project "${projectTitle}" ❤️`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:40px 16px;background:#231f20;font-family:'Inter','Segoe UI',sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td align="center">
            <table width="520" cellpadding="0" cellspacing="0" style="background:#111;border-radius:14px;border:1px solid #222;overflow:hidden;">
              <tr>
                <td style="padding:36px 36px 28px;text-align:center;">
                  <p style="font-size:40px;margin:0 0 8px;">❤️</p>
                  <h2 style="margin:0;font-size:22px;font-weight:800;color:#f1f5f9;letter-spacing:-0.02em;">
                    ${likerName} liked your project!
                  </h2>
                  <p style="margin:10px 0 0;font-size:14px;color:#64748b;">"${projectTitle}"</p>
                </td>
              </tr>
              <tr>
                <td style="padding:0 36px 32px;text-align:center;">
                  <a href="${projectUrl}" style="display:inline-block;padding:12px 28px;background:#2d43e8;color:#fff;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">
                    View Project →
                  </a>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 36px;border-top:1px solid #1e1e1e;text-align:center;">
                  <p style="margin:0;font-size:11px;color:#475569;">
                    <a href="${APP_URL}/settings" style="color:#2d43e8;text-decoration:none;">Manage email notifications</a>
                  </p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  });
}

/**
 * Send a "someone followed you" notification email.
 */
export async function sendFollowNotificationEmail({ toEmail, toName, followerName, followerUsername }) {
  return resend.emails.send({
    from: `Desayner <${FROM}>`,
    to: toEmail,
    subject: `${followerName} is now following you on Desayner 🎉`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:40px 16px;background:#231f20;font-family:'Inter','Segoe UI',sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td align="center">
            <table width="520" cellpadding="0" cellspacing="0" style="background:#111;border-radius:14px;border:1px solid #222;overflow:hidden;">
              <tr>
                <td style="padding:36px 36px 28px;text-align:center;">
                  <p style="font-size:40px;margin:0 0 8px;">🎉</p>
                  <h2 style="margin:0;font-size:22px;font-weight:800;color:#f1f5f9;letter-spacing:-0.02em;">
                    You have a new follower!
                  </h2>
                  <p style="margin:10px 0 0;font-size:14px;color:#94a3b8;">
                    <strong style="color:#f1f5f9;">${followerName}</strong> started following you on Desayner.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:0 36px 32px;text-align:center;">
                  <a href="${APP_URL}/profile/${followerUsername}" style="display:inline-block;padding:12px 28px;background:#2d43e8;color:#fff;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">
                    View Their Profile →
                  </a>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 36px;border-top:1px solid #1e1e1e;text-align:center;">
                  <p style="margin:0;font-size:11px;color:#475569;">
                    <a href="${APP_URL}/settings" style="color:#2d43e8;text-decoration:none;">Manage email notifications</a>
                  </p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  });
}

/**
 * Day-3 nudge for users who signed up but haven't published yet.
 */
export async function sendPortfolioNudgeEmail({ toEmail, toName, username }) {
  const profileUrl = `${APP_URL}/profile/${username}`;

  return resend.emails.send({
    from: `Desayner <${FROM}>`,
    to: toEmail,
    subject: 'Your portfolio is waiting — publish your first project 🎨',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:40px 16px;background:#231f20;font-family:'Inter','Segoe UI',sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="background:#111;border-radius:16px;border:1px solid #222;overflow:hidden;">
              <tr>
                <td style="padding:36px 40px 24px;text-align:center;">
                  <h2 style="margin:0;font-size:24px;font-weight:900;color:#f1f5f9;">
                    Hey ${toName || 'Designer'}, your profile is almost ready
                  </h2>
                  <p style="margin:12px 0 0;font-size:15px;color:#94a3b8;line-height:1.6;">
                    Designers with at least one published project get discovered faster on Desayner. Upload your best work today.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:0 40px 32px;text-align:center;">
                  <a href="${APP_URL}/projects/new" style="display:inline-block;padding:14px 32px;background:#2d43e8;color:#fff;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;margin-right:8px;">
                    Publish a project
                  </a>
                  <a href="${profileUrl}" style="display:inline-block;padding:14px 32px;background:#1e293b;color:#e2e8f0;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;">
                    View profile
                  </a>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  });
}
