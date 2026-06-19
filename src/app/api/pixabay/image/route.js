export const runtime = 'edge';

// Placeholder SVG — returned instead of a blank/error when the image can't be fetched.
// Keeps the card layout stable and avoids broken image icons in the browser.
const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f1f5f9"/><path d="M80 70h40v10H80zm0 20h40v10H80zm0 20h24v10H80z" fill="#cbd5e1"/><circle cx="100" cy="55" r="12" fill="#e2e8f0"/></svg>`;

function fallback() {
  return new Response(FALLBACK_SVG, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      // Cache the fallback for 5 minutes so we don't hammer the proxy on bad URLs
      'Cache-Control': 'public, max-age=300',
    },
  });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) return fallback();

  if (!/^https:\/\/(cdn\.pixabay\.com|pixabay\.com)\//i.test(url)) {
    return fallback();
  }

  try {
    // 6-second timeout — Vercel Edge has a 10s max; leave buffer for response streaming
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://pixabay.com/',
        'Accept': 'image/webp,image/avif,image/apng,image/*,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      console.error('[Pixabay Image Proxy Error]', res.status, res.statusText, url);
      return fallback();
    }

    const buffer = await res.arrayBuffer();

    return new Response(buffer, {
      headers: {
        'Content-Type': res.headers.get('content-type') || 'image/png',
        // Cache on Vercel's edge CDN for 7 days — thumbnails never change for a given URL.
        // stale-while-revalidate=86400 lets CDN serve stale for 1 day while refreshing.
        'Cache-Control': 'public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
        'Vary': 'Accept',
      },
    });
  } catch (err) {
    // AbortError = timeout, NetworkError = DNS/connection failure — return fallback in all cases
    console.error('[Pixabay Image Proxy Exception]', err.name, url);
    return fallback();
  }
}
