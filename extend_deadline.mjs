import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Key in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function extendDeadline() {
  console.log('====================================');
  console.log('⏳ UPDATING CONTEST DEADLINE');
  console.log('====================================\n');

  // 1. Find the active contest
  const { data: contests, error: fetchError } = await supabase
    .from('contests')
    .select('id, title, end_date')
    .eq('status', 'active')
    .limit(1);

  if (fetchError || !contests || contests.length === 0) {
    console.error("❌ Could not find an active contest.");
    return;
  }

  const contest = contests[0];
  console.log(`✅ Found active contest: "${contest.title}"`);
  console.log(`📅 Current Deadline: ${new Date(contest.end_date).toLocaleString()}`);

  // ==========================================
  // ✏️ EDIT YOUR NEW DEADLINE HERE
  // Format: 'YYYY-MM-DD HH:mm:ss' (24-hour format)
  // ==========================================
  const newDeadlineString = '2026-06-30 23:59:59'; // Example: June 30, 2026 at 11:59 PM
  
  // Convert to ISO string for Supabase (timestamptz)
  const newDeadlineISO = new Date(newDeadlineString).toISOString();

  console.log(`\n🔄 Changing deadline to: ${new Date(newDeadlineISO).toLocaleString()}...`);

  // 2. Update the database
  const { error: updateError } = await supabase
    .from('contests')
    .update({ end_date: newDeadlineISO })
    .eq('id', contest.id);

  if (updateError) {
    console.error("❌ Failed to update deadline:", updateError.message);
  } else {
    console.log("🎉 Successfully updated the deadline!");
  }
}

extendDeadline();
