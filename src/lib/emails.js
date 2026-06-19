import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/server';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Gets a user's email by their ID using the Supabase Admin API.
 * This is secure because the Admin API bypasses RLS and can read auth.users.
 */
async function getUserEmail(userId) {
  const supabase = await createAdminClient();
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error || !data.user) {
    console.error(`[Emails] Could not find user email for ID ${userId}:`, error?.message);
    return null;
  }
  return data.user.email;
}

export async function sendNewFollowerEmail({ targetUserId, followerName, followerUsername }) {
  if (!process.env.RESEND_API_KEY) return;
  
  const recipientEmail = await getUserEmail(targetUserId);
  if (!recipientEmail) return;

  try {
    const data = await resend.emails.send({
      from: 'Desayner <hello@desayner.com>',
      to: [recipientEmail],
      subject: `You have a new follower: ${followerName}`,
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e8e8e8; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
          <!-- Header -->
          <div style="background-color: #2d43e8; padding: 30px 20px; text-align: center;">
            <img src="https://desayner.com/desayner-logo-white.png" alt="Desayner" style="height: 35px; width: auto; display: block; margin: 0 auto;" />
          </div>
          <!-- Body -->
          <div style="padding: 40px 30px; color: #231f20;">
            <h2 style="color: #231f20; margin-top: 0; font-size: 22px;">New Follower! 🎉</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a;">Hi there,</p>
            <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a;"><strong>${followerName}</strong> (@${followerUsername}) just started following your profile on Desayner.</p>
            <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a;">Keep creating and sharing your amazing work!</p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="https://desayner.com/profile/${followerUsername}" style="display: inline-block; padding: 14px 32px; background-color: #e6e82d; color: #231f20; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; letter-spacing: 0.5px; text-transform: uppercase;">View Profile</a>
            </div>
          </div>
          <!-- Footer -->
          <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
            <p style="color: #888888; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Desayner. All rights reserved.</p>
          </div>
        </div>
      `,
    });
    console.log('[Emails] Follow notification sent:', data.id);
  } catch (error) {
    console.error('[Emails] Error sending follow notification:', error);
  }
}

