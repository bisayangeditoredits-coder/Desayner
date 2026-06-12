import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { Ratelimit } from '@upstash/ratelimit';

export const runtime = 'edge';

const UNSPLASH_API = 'https://api.unsplash.com';
const CACHE_HEADERS = {
  'Cache-Control': 's-maxage=3600, stale-while-revalidate=300',
};

// Rate limit: 30 searches per IP per 60 seconds
const searchRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '60 s'),
  analytics: false,
  prefix: 'rl:unsplash:search',
});

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q           = (searchParams.get('q') || '').trim();
  const page        = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const orientation = searchParams.get('orientation') || '';
  const perPage     = 20;

  if (!q) {
    return NextResponse.json({ results: [], total: 0 }, { headers: CACHE_HEADERS });
  }

  // ── 1. Check Redis cache before rate limiting ─────────────────────────────
  const cacheKey = `unsplash:search:${q.toLowerCase()}:${orientation}:${page}`;
  
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json(
        { ...cached, cached: true },
        { headers: CACHE_HEADERS }
      );
    }
  } catch (err) {
    console.error('[Unsplash Redis GET Error]', err);
  }

  // ── 2. Rate limit only cache misses ───────────────────────────────────────
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || request.headers.get('x-real-ip')
    || '127.0.0.1';
  const { success, remaining } = await searchRatelimit.limit(`ip:${ip}`);
  if (!success) {
    return NextResponse.json(
      { error: 'Too many search requests. Please wait a moment.' },
      { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
    );
  }

  // ── 3. Call Unsplash API ──────────────────────────────────────────────────
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    return NextResponse.json(
      { error: 'Unsplash API key not configured.' },
      { status: 503 }
    );
  }

  let url = `${UNSPLASH_API}/search/photos?query=${encodeURIComponent(q)}&per_page=${perPage}&page=${page}`;
  if (orientation) {
    url += `&orientation=${orientation}`;
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Client-ID ${accessKey}`,
      'Accept-Version': 'v1',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('[Unsplash API Error]', res.status, text);
    return NextResponse.json(
      { error: `Unsplash API error (${res.status})` },
      { status: res.status }
    );
  }

  const data = await res.json();

  // Extract only the fields we need (reduces cache payload size)
  const results = (data.results || []).map((photo) => ({
    id:          photo.id,
    description: photo.description || photo.alt_description || '',
    width:       photo.width,
    height:      photo.height,
    color:       photo.color,
    urls: {
      small:    photo.urls.small,
      regular:  photo.urls.regular,
      full:     photo.urls.full,
      download: photo.links.download_location, // for triggering download tracking
    },
    user: {
      name:     photo.user.name,
      username: photo.user.username,
      profile:  photo.user.links.html,
    },
  }));

  const payload = { results, total: data.total || 0, totalPages: data.total_pages || 0 };

  // ── 4. Cache for 1 hour ───────────────────────────────────────────────────
  try {
    await redis.setex(cacheKey, 3600, payload);
  } catch (err) {
    console.error('[Unsplash Redis SET Error]', err);
  }

  return NextResponse.json({ ...payload, cached: false }, {
    headers: { 
      ...CACHE_HEADERS,
      'X-RateLimit-Remaining': String(remaining)
    },
  });
}
