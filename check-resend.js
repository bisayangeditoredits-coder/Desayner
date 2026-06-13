require('dotenv').config({ path: '.env.local' });
async function checkResend() {
  const res = await fetch('https://api.resend.com/domains', {
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`
    }
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
checkResend();
