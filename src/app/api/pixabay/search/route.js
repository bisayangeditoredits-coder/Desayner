import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { Ratelimit } from '@upstash/ratelimit';

export const runtime = 'edge';

const PIXABAY_API = 'https://pixabay.com/api/';
const CACHE_HEADERS = {
  'Cache-Control': 's-maxage=3600, stale-while-revalidate=300',
};

// Rate limit: 30 searches per IP per 60 seconds (same as Unsplash)
const searchRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '60 s'),
  analytics: false,
  prefix: 'rl:pixabay:search',
});

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q           = (searchParams.get('q') || '').trim();
  const page        = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const imageType   = searchParams.get('type') || 'vector'; // vector or illustration
  const perPage     = 20;

  if (!q) {
    return NextResponse.json({ results: [], total: 0 }, { headers: CACHE_HEADERS });
  }

  // ── 1. Check Redis cache before rate limiting ─────────────────────────────
  const cacheKey = `pixabay:search:${q.toLowerCase()}:${imageType}:${page}`;
  
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json(
        { ...cached, cached: true },
        { headers: CACHE_HEADERS }
      );
    }
  } catch (err) {
    console.error('[Pixabay Redis GET Error]', err);
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

  // ── 3. Call Pixabay API ──────────────────────────────────────────────────
  const apiKey = process.env.PIXABAY_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Pixabay API key not configured.' },
      { status: 503 }
    );
  }

  let url = `${PIXABAY_API}?key=${apiKey}&q=${encodeURIComponent(q)}&image_type=${imageType}&per_page=${perPage}&page=${page}&safesearch=true`;

  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text();
    console.error('[Pixabay API Error]', res.status, text);
    return NextResponse.json(
      { error: `Pixabay API error (${res.status})` },
      { status: res.status }
    );
  }

  const data = await res.json();

  // Extract only the fields we need
  const results = (data.hits || []).map((hit) => ({
    id:          hit.id,
    tags:        hit.tags || '',
    width:       hit.imageWidth,
    height:      hit.imageHeight,
    urls: {
      preview:   hit.previewURL,
      webformat: hit.webformatURL,
      large:     hit.largeImageURL,
      vector:    hit.vectorURL, // Some vectors have an SVG URL if user is premium, but free users get PNG
    },
    user: {
      name:     hit.user,
      id:       hit.user_id,
    },
  }));

  const payload = { 
    results, 
    total: data.totalHits || 0, 
    totalPages: Math.ceil((data.totalHits || 0) / perPage) 
  };

  // ── 4. Cache for 1 hour ───────────────────────────────────────────────────
  try {
    await redis.setex(cacheKey, 3600, payload);
  } catch (err) {
    console.error('[Pixabay Redis SET Error]', err);
  }

  return NextResponse.json({ ...payload, cached: false }, {
    headers: { 
      ...CACHE_HEADERS,
      'X-RateLimit-Remaining': String(remaining)
    },
  });
}
