import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { createRateLimit, Ratelimit, safeLimit } from '@/lib/rateLimit';
import { createMemoryCache } from '@/lib/memoryCache';

export const runtime = 'edge';

const PIXABAY_API = 'https://pixabay.com/api/';
const CACHE_HEADERS = {
  'Cache-Control': 's-maxage=3600, stale-while-revalidate=300',
};
const responseCache = createMemoryCache('api:pixabay:search', { maxEntries: 500, ttlMs: 5 * 60_000 });

const searchRatelimit = createRateLimit({
  limiter: Ratelimit.slidingWindow(30, '60 s'),
  analytics: false,
  prefix: 'rl:pixabay:search',
});

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const imageType = searchParams.get('type') || 'vector';
  const perPage = 20;

  if (!q) {
    return NextResponse.json({ results: [], total: 0 }, { headers: CACHE_HEADERS });
  }

  const cacheKey = `pixabay:search:${q.toLowerCase()}:${imageType}:${page}`;
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
    console.error('[Pixabay Redis GET Error]', err);
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || request.headers.get('x-real-ip')
    || '127.0.0.1';
  const { success, remaining } = await safeLimit(searchRatelimit, `ip:${ip}`, {
    logPrefix: 'Pixabay Search RateLimit',
  });
  if (!success) {
    return NextResponse.json(
      { error: 'Too many search requests. Please wait a moment.' },
      { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
    );
  }

  const apiKey = process.env.PIXABAY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Pixabay API key not configured.' }, { status: 503 });
  }

  const url = `${PIXABAY_API}?key=${apiKey}&q=${encodeURIComponent(q)}&image_type=${imageType}&per_page=${perPage}&page=${page}&safesearch=true`;

  let res;
  try {
    res = await fetch(url, {
      signal: AbortSignal.timeout ? AbortSignal.timeout(8_000) : undefined,
    });
  } catch (err) {
    console.error('[Pixabay Fetch Error]', err);
    return NextResponse.json(
      { error: 'Pixabay is temporarily unavailable. Please try again shortly.' },
      { status: 503, headers: CACHE_HEADERS }
    );
  }

  if (!res.ok) {
    const text = await res.text();
    console.error('[Pixabay API Error]', res.status, text);
    return NextResponse.json({ error: `Pixabay API error (${res.status})` }, { status: res.status });
  }

  const data = await res.json();
  const results = (data.hits || []).map((hit) => ({
    id: hit.id,
    tags: hit.tags || '',
    width: hit.imageWidth,
    height: hit.imageHeight,
    urls: {
      preview: hit.previewURL,
      webformat: hit.webformatURL,
      large: hit.largeImageURL,
      vector: hit.vectorURL,
    },
    user: {
      name: hit.user,
      id: hit.user_id,
    },
  }));

  const payload = {
    results,
    total: data.totalHits || 0,
    totalPages: Math.ceil((data.totalHits || 0) / perPage),
  };

  try {
    responseCache.set(cacheKey, payload);
    await redis.setex(cacheKey, 3600, payload);
  } catch (err) {
    console.error('[Pixabay Redis SET Error]', err);
  }

  return NextResponse.json({ ...payload, cached: false }, {
    headers: {
      ...CACHE_HEADERS,
      'X-RateLimit-Remaining': String(remaining),
    },
  });
}