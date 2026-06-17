const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function test() {
  const env = fs.readFileSync('.env.local', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1].trim();
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1].trim();

  const supabase = createClient(url, key);
  
  // Try to query contest_votes
  const { data, error } = await supabase.from('contest_votes').select('*').limit(1);
  console.log("Query contest_votes error:", error);
  console.log("Query contest_votes data:", data);
}
test();
