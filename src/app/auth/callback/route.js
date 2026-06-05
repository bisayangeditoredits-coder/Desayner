import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * Supabase Auth Callback Route
 *
 * Supabase redirects here after:
 * - Email confirmation (new signups)
 * - Magic link login
 * - OAuth (Google, GitHub, etc.)
 *
 * This route exchanges the one-time code for a session
 * and then redirects the user to the dashboard (or wherever they came from).
 */
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/';

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && sessionData?.user) {
      const user = sessionData.user;
      
      // Auto-populate profile from Google/OAuth metadata if it doesn't exist
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
        
      if (!existingProfile) {
        const rawMeta = user.user_metadata || {};
        const fullName = rawMeta.full_name || rawMeta.name || '';
        let username = fullName.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!username) username = `user_${Date.now()}`;
        
        await supabase.from('profiles').insert({
          id: user.id,
          full_name: fullName,
          username: username,
          avatar_url: rawMeta.avatar_url || rawMeta.picture || ''
        });
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Something went wrong — send to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
