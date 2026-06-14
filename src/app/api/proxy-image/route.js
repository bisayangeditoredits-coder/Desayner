// Remove Edge runtime because Vercel Edge (which runs on Cloudflare Workers)
// blocks fetch requests to other Cloudflare-hosted domains (like base44.app).
// Using the Node.js runtime (AWS Lambda) bypasses this cross-zone blocking.
export const dynamic = 'force-dynamic';
// A simple placeholder SVG that looks like a blank document/logo to avoid red 404 console errors
const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" fill="#f8fafc"/><path d="M44 38h40v10H44zm0 20h40v10H44zm0 20h24v10H44z" fill="#cbd5e1"/></svg>`;

function getFallbackResponse() {
  return new Response(FALLBACK_SVG, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB guard

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) return getFallbackResponse();

    // Only proxy http(s) URLs for safety
    if (!/^https?:\/\//i.test(url)) return getFallbackResponse();

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/avif,image/apng,image/*,*/*;q=0.8',
        'Referer': new URL(url).origin + '/',
      },
      // Add a timeout so Vercel Serverless doesn't hang indefinitely
      signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined,
    });

    if (!response.ok || !response.body) return getFallbackResponse();

    // Guard against giant images hogging server memory
    const contentLength = Number(response.headers.get('content-length') || 0);
    if (contentLength > MAX_SIZE) return getFallbackResponse();

    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Stream the response body directly to the client — no buffering,
    // so time-to-first-byte is fast and memory usage stays low.
    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'Vary': 'Accept',
        // Let CDN/browser cache by URL
        ...(response.headers.get('etag') ? { 'ETag': response.headers.get('etag') } : {}),
      },
    });
  } catch {
    return getFallbackResponse();
  }
}
