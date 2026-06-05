import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env.local' });
import ws from 'ws';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { realtime: { transport: ws } });

async function fix() {
  const { data, error } = await supabase.from('projects').select('id, thumbnail_url, cover_url').is('cover_url', null).not('thumbnail_url', 'is', null);
  console.log(`Found ${data.length} projects to fix`);
  for (const p of data) {
    await supabase.from('projects').update({ cover_url: p.thumbnail_url }).eq('id', p.id);
  }
  console.log('Done fixing cover_urls!');
}
fix();
