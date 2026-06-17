import { Resend } from 'resend';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.error("Missing RESEND_API_KEY in .env.local");
  process.exit(1);
}

const resend = new Resend(resendApiKey);

async function sendAnnouncement() {
  console.log('====================================');
  console.log('📢 PREPARING GENERAL ANNOUNCEMENT');
  console.log('====================================\n');
  
  // =========================================================================
  // ✏️ EDIT YOUR EMAIL HERE (EDIT SUBJECT AND HTML BODY)
  // =========================================================================
  
  const subjectLine = "🛠 Scheduled Maintenance Update for Desayner";
  
  // You can use basic HTML like <strong> for bold, <p> for paragraphs, and <br> for line breaks.
  const emailBodyHTML = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #0f172a;">Maintenance Update</h1>
      <p>Hi Desayner,</p>
      
      <p>We will be performing a scheduled maintenance on <strong>Sunday at 12:00 AM</strong>.</p>
      
      <p>The website may be temporarily unavailable for around 1 hour. This upgrade will bring faster load times and new features to your portfolio!</p>
      
      <p>Thank you for your patience and for being part of our community.</p>
      <br/>
      <p>- The Desayner Team</p>
    </div>
  `;
  
  // =========================================================================

  console.log('1. Fetching all registered users from database...');
  const usersRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
  });
  
  if (!usersRes.ok) {
    console.error("❌ Error fetching users.");
    return;
  }

  const { users } = await usersRes.json();
  const emails = users.map(u => u.email).filter(Boolean);
  
  console.log(`✅ Found ${emails.length} users to email.\n`);

  if (emails.length === 0) return;

  const senderEmail = 'hello@desayner.com';
  const emailBatches = emails.map(email => ({
    from: `Desayner Team <${senderEmail}>`,
    to: [email],
    subject: subjectLine,
    html: emailBodyHTML,
  }));

  console.log('2. Sending emails via Resend...');
  const chunkSize = 100;
  for (let i = 0; i < emailBatches.length; i += chunkSize) {
    const chunk = emailBatches.slice(i, i + chunkSize);
    const result = await resend.batch.send(chunk);
    
    if (result.error) {
      console.error(`❌ Batch error:`, result.error);
    } else {
      console.log(`✅ Batch sent successfully!`);
    }
  }
  
  console.log('\n🎉 Finished sending general announcement!');
}

sendAnnouncement();
