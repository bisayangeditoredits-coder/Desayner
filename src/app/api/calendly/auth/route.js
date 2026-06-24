import { NextResponse } from 'next/server';

export async function GET(request) {
  const clientId = process.env.NEXT_PUBLIC_CALENDLY_CLIENT_ID;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = `${baseUrl}/api/calendly/callback`;

  if (!clientId) {
    return NextResponse.json({ error: 'Calendly Client ID not configured' }, { status: 500 });
  }

  const authUrl = new URL('https://auth.calendly.com/oauth/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', redirectUri);

  return NextResponse.redirect(authUrl.toString());
}
