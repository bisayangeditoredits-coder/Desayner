import { NextResponse } from 'next/server';
import { createRateLimit, Ratelimit, safeLimit } from '@/lib/rateLimit';

export const runtime = 'edge';

const downloadRatelimit = createRateLimit({
  limiter: Ratelimit.slidingWindow(60, '60 s'),
  analytics: false,
  prefix: 'rl:unsplash:download',
});

function isSafeUnsplashDownloadUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:'
      && url.hostname === 'api.unsplash.com'
      && /^\/photos\/[^/]+\/download$/.test(url.pathname);
  } catch {
    return false;
  }
}

export async function POST(request) {
  try {
    const { downloadLocation } = await request.json();

    if (!downloadLocation || !isSafeUnsplashDownloadUrl(downloadLocation)) {
      return NextResponse.json({ error: 'Invalid downloadLocation' }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
      || request.headers.get('x-real-ip')
      || '127.0.0.1';
    const { success, remaining } = await safeLimit(downloadRatelimit, `ip:${ip}`, {
      logPrefix: 'Unsplash Download RateLimit',
    });
    if (!success) {
      return NextResponse.json(
        { error: 'Too many download requests. Please wait a moment.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
      );
    }

    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey) {
      return NextResponse.json({ error: 'Unsplash API key not configured' }, { status: 503 });
    }

    let res;
    try {
      res = await fetch(downloadLocation, {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
          'Accept-Version': 'v1',
        },
        signal: AbortSignal.timeout ? AbortSignal.timeout(8_000) : undefined,
      });
    } catch (err) {
      console.error('[Unsplash Download Fetch Error]', err);
      return NextResponse.json(
        { error: 'Unsplash download tracking is temporarily unavailable' },
        { status: 503 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: `Unsplash tracking error (${res.status})` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({ downloadUrl: data.url });
  } catch (err) {
    console.error('[Unsplash Download Error]', err);
    return NextResponse.json({ error: 'Failed to get download URL' }, { status: 500 });
  }
}