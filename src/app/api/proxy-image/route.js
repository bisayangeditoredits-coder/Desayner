// Remove Edge runtime because Vercel Edge (which runs on Cloudflare Workers)
// blocks fetch requests to other Cloudflare-hosted domains (like base44.app).
// Using the Node.js runtime (AWS Lambda) bypasses this cross-zone blocking.
import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '60 s'),
  analytics: false,
  prefix: 'rl:proxy-image',
});

// Hostname allowlist — mirrors next.config.mjs remotePatterns
const ALLOWED_HOST_PATTERNS = [
  /^.+\.r2\.dev$/i,
  /^.+\.unsplash\.com$/i,
  /^images\.unsplash\.com$/i,
  /^.+\.supabase\.co$/i,
  /^.+\.googleusercontent\.com$/i,
  /^avatars\.githubusercontent\.com$/i,
  /^base44\.app$/i,
  /^res\.cloudinary\.com$/i,
  /^cdn\.pixabay\.com$/i,
  /^pixabay\.com$/i,
  /^wsrv\.nl$/i,
];

function isAllowedHost(hostname) {
  return ALLOWED_HOST_PATTERNS.some((pattern) => pattern.test(hostname));
}

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
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
      || request.headers.get('x-real-ip')
      || 'unknown';

    const { success } = await ratelimit.limit(`ip:${ip}`);
    if (!success) {
      return getFallbackResponse();
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) return getFallbackResponse();

    // Only proxy http(s) URLs for safety
    if (!/^https?:\/\//i.test(url)) return getFallbackResponse();

    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      return getFallbackResponse();
    }

    if (!isAllowedHost(parsedUrl.hostname)) {
      return getFallbackResponse();
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/avif,image/apng,image/*,*/*;q=0.8',
        'Referer': parsedUrl.origin + '/',
      },
      // Add a timeout so Vercel Serverless doesn't hang indefinitely
      signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined,
    });

    if (!response.ok || !response.body) return getFallbackResponse();

    // Guard against giant images hogging server memory
    const contentLength = Number(response.headers.get('content-length') || 0);
    if (contentLength > MAX_SIZE) return getFallbackResponse();

    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Buffer the response instead of streaming. Vercel Node.js Serverless 
    // functions notoriously drop ReadableStreams from fetch() prematurely,
    // causing 500/504 errors on production. Buffering guarantees delivery.
    const buffer = await response.arrayBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'Vary': 'Accept',
        ...(response.headers.get('etag') ? { 'ETag': response.headers.get('etag') } : {}),
      },
    });
  } catch (err) {
    console.error('Proxy Image Error:', err);
    return getFallbackResponse();
  }
}
