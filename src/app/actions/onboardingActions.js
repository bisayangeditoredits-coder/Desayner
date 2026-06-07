'use server';

import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// SECURITY FIX: Added authentication check to prevent unauthorized profile modifications
export async function saveProfileAdmin(profileData) {
  try {
    // 1. Verify user is authenticated
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // 2. Only allow users to modify their own profile
    if (profileData.id && profileData.id !== user.id) {
      return { success: false, error: 'Cannot modify other users\' profiles' };
    }

    // 3. Ensure the profile being modified belongs to the authenticated user
    const profileToUpdate = { ...profileData, id: user.id };

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Using upsert with service role bypasses RLS and guarantees the row is created
    const { error } = await supabaseAdmin
      .from('profiles')
      .upsert(profileToUpdate);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
