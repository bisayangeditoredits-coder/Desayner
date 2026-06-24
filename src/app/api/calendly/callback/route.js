import { NextResponse } from 'next/server';
import { createAdminClient, getServerAuth } from '@/lib/supabase/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (error || !code) {
    return NextResponse.redirect(`${baseUrl}/settings?error=calendly_auth_failed`);
  }

  try {
    const { user, admin } = await getServerAuth(request);
    
    if (!user) {
      return NextResponse.redirect(`${baseUrl}/login?redirectTo=/settings`);
    }

    // 1. Exchange code for access token
    const clientId = process.env.NEXT_PUBLIC_CALENDLY_CLIENT_ID;
    const clientSecret = process.env.CALENDLY_CLIENT_SECRET;
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const tokenResponse = await fetch('https://auth.calendly.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${baseUrl}/api/calendly/callback`,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Calendly token error:', tokenData);
      return NextResponse.redirect(`${baseUrl}/settings?error=calendly_token_failed`);
    }

    const { access_token } = tokenData;

    // 2. Fetch user's Calendly details
    const userResponse = await fetch('https://api.calendly.com/users/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const userData = await userResponse.json();

    if (!userResponse.ok) {
      console.error('Calendly user fetch error:', userData);
      return NextResponse.redirect(`${baseUrl}/settings?error=calendly_user_failed`);
    }

    const schedulingUrl = userData.resource.scheduling_url;

    if (!schedulingUrl) {
      return NextResponse.redirect(`${baseUrl}/settings?error=calendly_no_url`);
    }

    // 3. Save to Supabase (using admin client to bypass RLS since it's a server update)
    const { error: dbError } = await admin
      .from('profiles')
      .update({ calendly_link: schedulingUrl })
      .eq('id', user.id);

    if (dbError) {
      console.error('Supabase update error:', dbError);
      return NextResponse.redirect(`${baseUrl}/settings?error=calendly_db_failed`);
    }

    return NextResponse.redirect(`${baseUrl}/settings?success=calendly_connected`);
  } catch (err) {
    console.error('Calendly callback caught error:', err);
    return NextResponse.redirect(`${baseUrl}/settings?error=calendly_server_error`);
  }
}
