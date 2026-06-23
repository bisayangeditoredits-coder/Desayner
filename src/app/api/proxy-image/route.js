// Remove Edge runtime because Vercel Edge blocks fetch requests to some Cloudflare-hosted domains.
// Using the Node.js runtime keeps legacy hotlink-blocked image fetches reliable.
import { createRateLimit, Ratelimit, safeLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const ratelimit = createRateLimit({
  limiter: Ratelimit.slidingWindow(300, '60 s'),
  analytics: false,
  prefix: 'rl:proxy-image',
});

const REDIRECT_SAFE_PATTERNS = [
  /^.+\.r2\.dev$/i,
  /^.+\.supabase\.co$/i,
  /^.+\.googleusercontent\.com$/i,
  /^avatars\.githubusercontent\.com$/i,
  /^res\.cloudinary\.com$/i,
  /^.+\.unsplash\.com$/i,
  /^images\.unsplash\.com$/i,
  /^wsrv\.nl$/i,
  /^cdn\.pixabay\.com$/i,
  /^pixabay\.com$/i,
];

const PROXY_REQUIRED_PATTERNS = [
  /^base44\.app$/i,
];

const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" fill="#f8fafc"/><path d="M44 38h40v10H44zm0 20h40v10H44zm0 20h24v10H44z" fill="#cbd5e1"/></svg>`;
const MAX_SIZE = 10 * 1024 * 1024;

function isRedirectSafe(hostname) {
  return REDIRECT_SAFE_PATTERNS.some((pattern) => pattern.test(hostname));
}

function isProxyRequired(hostname) {
  return PROXY_REQUIRED_PATTERNS.some((pattern) => pattern.test(hostname));
}

function getFallbackResponse(status = 200, headers = {}) {
  return new Response(FALLBACK_SVG, {
    status,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': status === 200 ? 'public, max-age=86400' : 'no-store',
      ...headers,
    },
  });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url || !/^https?:\/\//i.test(url)) return getFallbackResponse();

    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      return getFallbackResponse();
    }

    const { hostname } = parsedUrl;

    if (isRedirectSafe(hostname)) {
      return Response.redirect(url, 302);
    }

    if (!isProxyRequired(hostname)) {
      return getFallbackResponse();
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
      || request.headers.get('x-real-ip')
      || 'unknown';

    const { success, reset } = await safeLimit(ratelimit, `ip:${ip}`, {
      logPrefix: 'Proxy Image RateLimit',
    });
    if (!success) {
      const retryAfterSeconds = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
      console.warn(`[proxy-image] Rate limit exceeded for IP ${ip}. Retry after ${retryAfterSeconds}s.`);
      return getFallbackResponse(429, {
        'Retry-After': String(retryAfterSeconds),
        'X-Rate-Limited': 'true',
      });
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/avif,image/apng,image/*,*/*;q=0.8',
        'Referer': parsedUrl.origin + '/',
      },
      signal: AbortSignal.timeout ? AbortSignal.timeout(8_000) : undefined,
    });

    if (!response.ok || !response.body) return getFallbackResponse();

    const contentLength = Number(response.headers.get('content-length') || 0);
    if (contentLength > MAX_SIZE) return getFallbackResponse();

    const contentType = response.headers.get('content-type') || 'image/jpeg';
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