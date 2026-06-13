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
  let next = searchParams.get('next') || '/';

  // SECURITY FIX: Validate redirect URL to prevent open redirect attacks
  // Only allow same-origin URLs (starting with /)
  if (!next.startsWith('/') || next.includes('//')) {
    next = '/';
  }
  try {
    new URL(`${origin}${next}`); // Validate it's a valid URL
  } catch {
    next = '/';
  }

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
        let baseUsername = fullName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';

        // Retry with a random suffix on username collision (unique constraint)
        let inserted = false;
        let attempts = 0;
        while (!inserted && attempts < 5) {
          const username = attempts === 0 ? baseUsername : `${baseUsername}_${Math.floor(Math.random() * 9999)}`;
          const { error: insertError } = await supabase.from('profiles').insert({
            id: user.id,
            full_name: fullName,
            username,
            avatar_url: rawMeta.avatar_url || rawMeta.picture || ''
          });
          if (!insertError) {
            inserted = true;
          } else if (insertError.code === '23505') {
            // Unique violation — username taken, try again with suffix
            attempts++;
          } else {
            console.error('Profile creation failed:', insertError);
            return NextResponse.redirect(`${origin}/login?error=profile_creation_failed`);
          }
        }

        if (!inserted) {
          console.error('Profile creation failed: could not generate unique username after 5 attempts');
          return NextResponse.redirect(`${origin}/login?error=profile_creation_failed`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    } else if (error) {
      console.error('Auth error:', error);
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
    }
  }

  // Something went wrong — send to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
