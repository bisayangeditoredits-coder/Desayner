async function test() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const res = await fetch(`${url}/rest/v1/project_comments?select=*,profiles(*)`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  console.log(res.status, await res.text());
}
test();
