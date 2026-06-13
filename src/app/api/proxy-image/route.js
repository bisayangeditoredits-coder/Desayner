import { NextResponse } from 'next/server';

// A simple placeholder SVG that looks like a blank document/logo to avoid red 404 console errors
const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" fill="#f8fafc"/><path d="M44 38h40v10H44zm0 20h40v10H44zm0 20h24v10H44z" fill="#cbd5e1"/></svg>`;

function getFallbackResponse() {
  const headers = new Headers();
  headers.set('Content-Type', 'image/svg+xml');
  headers.set('Cache-Control', 'public, max-age=86400');
  return new NextResponse(FALLBACK_SVG, { status: 200, headers });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return getFallbackResponse();
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': new URL(url).origin + '/',
      },
      next: { revalidate: 86400 } // Cache for 24 hours
    });

    if (!response.ok) {
      return getFallbackResponse();
    }

    const arrayBuffer = await response.arrayBuffer();
    const headers = new Headers();
    headers.set('Content-Type', response.headers.get('Content-Type') || 'image/jpeg');
    headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');

    return new NextResponse(arrayBuffer, { headers });
  } catch (err) {
    return getFallbackResponse();
  }
}
