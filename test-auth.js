const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf-8');
const SUPABASE_URL = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1];
const SUPABASE_KEY = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1];

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function test() {
  const email = `testuser_${Date.now()}@example.com`;
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email,
    password: 'password123'
  });

  if (authErr) {
    console.error('Auth error:', authErr);
    return;
  }

  const token = authData.session.access_token;
  console.log('Got token, calling /api/upload...');

  // The cookie name format in Next.js Server Client might be 'sb-[project-id]-auth-token'
  // Let's just pass the Authorization header, as getServerAuth might check both.
  // Actually, createServerClient by default only checks cookies.
  // Let's set the cookie properly for Supabase SSR.
  const projectId = new URL(SUPABASE_URL).hostname.split('.')[0]; // evedqxhkmzpagqztrapq
  
  const res = await fetch('http://localhost:3000/api/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `sb-${projectId}-auth-token=${encodeURIComponent(JSON.stringify(['access_token', token]))}`
    },
    body: JSON.stringify({ folder: 'test' })
  });

  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Body:', text);
}

test();
