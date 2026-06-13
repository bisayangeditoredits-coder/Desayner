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
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
          <h2 style="color: #2d43e8;">New Follower! 🎉</h2>
          <p>Hi there,</p>
          <p><strong>${followerName}</strong> (@${followerUsername}) just started following your profile on Desayner.</p>
          <p>Keep up the great work!</p>
          <br/>
          <a href="https://desayner.com/profile/${followerUsername}" style="display: inline-block; padding: 12px 24px; background-color: #2d43e8; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">View their profile</a>
          <br/><br/>
          <p style="color: #666; font-size: 12px;">Best,<br/>The Desayner Team</p>
        </div>
      `,
    });
    console.log('[Emails] Follow notification sent:', data.id);
  } catch (error) {
    console.error('[Emails] Error sending follow notification:', error);
  }
}

export async function sendNewMessageEmail({ targetUserId, senderName, senderUsername, messageSnippet }) {
  if (!process.env.RESEND_API_KEY) return;

  const recipientEmail = await getUserEmail(targetUserId);
  if (!recipientEmail) return;

  try {
    const data = await resend.emails.send({
      from: 'Desayner <hello@desayner.com>',
      to: [recipientEmail],
      subject: `New message from ${senderName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
          <h2 style="color: #2d43e8;">You have a new message</h2>
          <p>Hi there,</p>
          <p><strong>${senderName}</strong> (@${senderUsername}) sent you a message on Desayner:</p>
          <blockquote style="border-left: 4px solid #e5e7eb; padding-left: 16px; margin: 16px 0; font-style: italic; color: #4b5563;">
            "${messageSnippet}"
          </blockquote>
          <br/>
          <a href="https://desayner.com/messages" style="display: inline-block; padding: 12px 24px; background-color: #2d43e8; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">Reply to Message</a>
          <br/><br/>
          <p style="color: #666; font-size: 12px;">Best,<br/>The Desayner Team</p>
        </div>
      `,
    });
    console.log('[Emails] Message notification sent:', data.id);
  } catch (error) {
    console.error('[Emails] Error sending message notification:', error);
  }
}
