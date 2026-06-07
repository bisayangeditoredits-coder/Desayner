'use server';

import { createClient } from '@supabase/supabase-js';

export async function saveProfileAdmin(profileData) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Using upsert with service role bypasses RLS and guarantees the row is created
    const { error } = await supabaseAdmin
      .from('profiles')
      .upsert(profileData);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
