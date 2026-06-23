import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { createRateLimit, Ratelimit, safeLimit } from '@/lib/rateLimit';
import { createMemoryCache } from '@/lib/memoryCache';

export const runtime = 'edge';

const UNSPLASH_API = 'https://api.unsplash.com';
const CACHE_HEADERS = {
  'Cache-Control': 's-maxage=3600, stale-while-revalidate=300',
};
const responseCache = createMemoryCache('api:unsplash:search', { maxEntries: 500, ttlMs: 5 * 60_000 });

const searchRatelimit = createRateLimit({
  limiter: Ratelimit.slidingWindow(30, '60 s'),
  analytics: false,
  prefix: 'rl:unsplash:search',
});

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const orientation = searchParams.get('orientation') || '';
  const perPage = 20;

  if (!q) {
    return NextResponse.json({ results: [], total: 0 }, { headers: CACHE_HEADERS });
  }

  const cacheKey = `unsplash:search:${q.toLowerCase()}:${orientation}:${page}`;
  const memoryCached = responseCache.get(cacheKey);
  if (memoryCached) {
    return NextResponse.json({ ...memoryCached, cached: true, cache: 'memory' }, { headers: CACHE_HEADERS });
  }

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      responseCache.set(cacheKey, cached);
      return NextResponse.json({ ...cached, cached: true, cache: 'redis' }, { headers: CACHE_HEADERS });
    }
  } catch (err) {
    console.error('[Unsplash Redis GET Error]', err);
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || request.headers.get('x-real-ip')
    || '127.0.0.1';
  const { success, remaining } = await safeLimit(searchRatelimit, `ip:${ip}`, {
    logPrefix: 'Unsplash Search RateLimit',
  });
  if (!success) {
    return NextResponse.json(
      { error: 'Too many search requests. Please wait a moment.' },
      { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
    );
  }

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    return NextResponse.json({ error: 'Unsplash API key not configured.' }, { status: 503 });
  }

  let url = `${UNSPLASH_API}/search/photos?query=${encodeURIComponent(q)}&per_page=${perPage}&page=${page}`;
  if (orientation) url += `&orientation=${orientation}`;

  let res;
  try {
    res = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        'Accept-Version': 'v1',
      },
      signal: AbortSignal.timeout ? AbortSignal.timeout(8_000) : undefined,
    });
  } catch (err) {
    console.error('[Unsplash Fetch Error]', err);
    return NextResponse.json(
      { error: 'Unsplash is temporarily unavailable. Please try again shortly.' },
      { status: 503, headers: CACHE_HEADERS }
    );
  }

  if (!res.ok) {
    const text = await res.text();
    console.error('[Unsplash API Error]', res.status, text);
    return NextResponse.json({ error: `Unsplash API error (${res.status})` }, { status: res.status });
  }

  const data = await res.json();
  const results = (data.results || []).map((photo) => ({
    id: photo.id,
    description: photo.description || photo.alt_description || '',
    width: photo.width,
    height: photo.height,
    color: photo.color,
    urls: {
      small: photo.urls.small,
      regular: photo.urls.regular,
      full: photo.urls.full,
      download: photo.links.download_location,
    },
    user: {
      name: photo.user.name,
      username: photo.user.username,
      profile: photo.user.links.html,
    },
  }));

  const payload = { results, total: data.total || 0, totalPages: data.total_pages || 0 };

  try {
    responseCache.set(cacheKey, payload);
    await redis.setex(cacheKey, 3600, payload);
  } catch (err) {
    console.error('[Unsplash Redis SET Error]', err);
  }

  return NextResponse.json({ ...payload, cached: false }, {
    headers: {
      ...CACHE_HEADERS,
      'X-RateLimit-Remaining': String(remaining),
    },
  });
}