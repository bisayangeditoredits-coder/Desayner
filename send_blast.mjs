import { Resend } from 'resend';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.error("Missing RESEND_API_KEY in .env.local. Please add it first.");
  process.exit(1);
}

const resend = new Resend(resendApiKey);

async function sendEmailBlast() {
  console.log('====================================');
  console.log('🚀 PREPARING EMAIL BLAST');
  console.log('====================================\n');
  
  console.log('1. Fetching active contest...');
  const contestRes = await fetch(`${supabaseUrl}/rest/v1/contests?status=eq.active&select=*&limit=1`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });
  const contests = await contestRes.json();
  const contest = contests[0];
  
  if (!contest) {
    console.error("❌ No active contest found!");
    return;
  }

  console.log(`✅ Found active contest: "${contest.title}"\n`);
  console.log('2. Fetching all registered users from database...');
  
  // Fetch users via Supabase Admin API
  const usersRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });
  
  if (!usersRes.ok) {
    console.error("❌ Error fetching users. Make sure SUPABASE_SERVICE_ROLE_KEY is set in .env.local");
    const errText = await usersRes.text();
    console.error(errText);
    return;
  }

  const { users } = await usersRes.json();

  const emails = users.map(u => u.email).filter(Boolean);
  console.log(`✅ Found ${emails.length} users to email.\n`);

  if (emails.length === 0) {
    console.log("No users to send emails to. Aborting.");
    return;
  }

  // 🔴 IMPORTANT: If you have a verified domain in Resend (e.g. desayner.com), change 'onboarding@resend.dev' to 'hello@desayner.com'
  const senderEmail = 'hello@desayner.com';

  const emailBatches = emails.map(email => ({
    from: `Desayner Contests <${senderEmail}>`,
    to: [email],
    subject: `New Contest Alert: ${contest.title} - Win ${contest.prize}!`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #0f172a;">🏆 New Design Contest</h1>
        <p>Hi there,</p>
        <p>We've just launched a brand new contest on Desayner: <strong>${contest.title}</strong>.</p>
        <p><strong>Prize:</strong> ${contest.prize}</p>
        <p>${contest.description}</p>
        <div style="margin-top: 30px; text-align: center;">
          <a href="https://desayner.com/contests/${contest.id}" style="background-color: #e3ec1e; color: #0f172a; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            View Contest & Join
          </a>
        </div>
        <p style="margin-top: 40px; color: #888; font-size: 12px;">
          You are receiving this because you signed up on Desayner.
        </p>
      </div>
    `,
  }));

  console.log('3. Sending emails via Resend...');
  const chunkSize = 100;
  for (let i = 0; i < emailBatches.length; i += chunkSize) {
    const chunk = emailBatches.slice(i, i + chunkSize);
    const result = await resend.batch.send(chunk);
    
    if (result.error) {
      console.error(`❌ Batch error:`, result.error);
    } else {
      console.log(`✅ Batch sent successfully!`, result.data);
    }
  }
  
  console.log('\n🎉 Finished sending email blast!');
}

sendEmailBlast();
