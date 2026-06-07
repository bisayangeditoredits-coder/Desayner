'use server';

import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function saveProfileAdmin(profileData) {
  try {
    const cookieStore = await cookies();
    
    // 1. Verify the user's identity securely on the server
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          },
        },
      }
    );

    const { data: { user } } = await supabaseAuth.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Unauthorized: You must be logged in.' };
    }

    if (user.id !== profileData.id) {
      return { success: false, error: 'Forbidden: You can only update your own profile.' };
    }

    // 2. Perform the update with service role now that identity is verified
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

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
