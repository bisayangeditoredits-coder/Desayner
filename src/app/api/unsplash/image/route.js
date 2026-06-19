export const runtime = 'edge';

// NOTE: This proxy is NO LONGER used for stock photo thumbnails.
// Thumbnails now load directly from Unsplash's Imgix CDN via unsplashImageSrc() in utils.js.
// This proxy is only called for the download flow where we need server-side proxying.
//
// Keeping it live in case direct CDN links are unavailable or for fallback use.

const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f1f5f9"/><path d="M80 70h40v10H80zm0 20h40v10H80zm0 20h24v10H80z" fill="#cbd5e1"/><circle cx="100" cy="55" r="12" fill="#e2e8f0"/></svg>`;

function fallback() {
  return new Response(FALLBACK_SVG, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=300',
    },
  });
}

// Validate IP format to prevent header-spoofed rate-limit bypass
function sanitizeIP(ip) {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^[\da-f:]+$/i;
  if (!ip) return 'unknown';
  const cleanedIp = ip.split(',')[0].trim();
  if (!ipv4Regex.test(cleanedIp) && !ipv6Regex.test(cleanedIp)) return 'unknown';
  return cleanedIp;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) return fallback();

  if (!/^https:\/\/images\.unsplash\.com\//i.test(url)) {
    return fallback();
  }

  try {
    // 6-second timeout — leaves buffer before Vercel Edge's 10s hard limit
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Desayner/1.0)',
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        Referer: 'https://unsplash.com/',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      console.error('[Unsplash Image Proxy Error]', res.status, res.statusText, url);
      return fallback();
    }

    const buffer = await res.arrayBuffer();

    return new Response(buffer, {
      headers: {
        'Content-Type': res.headers.get('content-type') || 'image/jpeg',
        // Cache at Vercel's edge CDN for 7 days — Unsplash image URLs are content-addressed
        'Cache-Control': 'public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
        'Vary': 'Accept',
      },
    });
  } catch (err) {
    console.error('[Unsplash Image Proxy Exception]', err.name, url);
    return fallback();
  }
}
