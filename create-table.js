require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { error } = await supabase.rpc('exec_sql', {
    sql_query: `
      CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
      );
      
      -- Set up RLS
      ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
      
      -- Allow anyone to insert
      CREATE POLICY "Allow public insert to subscribers" ON public.newsletter_subscribers
        FOR INSERT WITH CHECK (true);
        
      -- Only service role can read/delete
    `
  });
  console.log('Result:', error);
}
run();
