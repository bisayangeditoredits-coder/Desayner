import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { createRateLimit, Ratelimit, safeLimit } from '@/lib/rateLimit';
import { createMemoryCache } from '@/lib/memoryCache';

export const runtime = 'edge';

const CACHE_HEADERS = { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' };
const colorCache = createMemoryCache('api:colors', { maxEntries: 250, ttlMs: 10 * 60_000 });

const colorRatelimit = createRateLimit({
  limiter: Ratelimit.slidingWindow(30, '60 s'),
  analytics: false,
  prefix: 'rl:colors',
});

function normalizeInput(input) {
  if (!Array.isArray(input) || input.length !== 5) {
    return ['N', 'N', 'N', 'N', 'N'];
  }

  return input.map((item) => {
    if (item === 'N') return 'N';
    if (!Array.isArray(item) || item.length !== 3) return 'N';
    const rgb = item.map((value) => Number(value));
    if (rgb.some((value) => !Number.isInteger(value) || value < 0 || value > 255)) return 'N';
    return rgb;
  });
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((x) => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function fallbackPalette(input) {
  const seed = JSON.stringify(input).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return Array.from({ length: 5 }, (_, index) => {
    const hue = (seed + index * 47) % 360;
    const saturation = 58 + ((seed + index * 11) % 24);
    const lightness = 38 + ((seed + index * 7) % 34);
    return hslToHex(hue, saturation, lightness);
  });
}

function hslToHex(h, s, l) {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

export async function POST(request) {
  try {
    const body = await request.json();
    const input = normalizeInput(body.input);
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
      || request.headers.get('x-real-ip')
      || '127.0.0.1';

    const { success, remaining } = await safeLimit(colorRatelimit, `ip:${ip}`, {
      logPrefix: 'Colors RateLimit',
    });
    if (!success) {
      return NextResponse.json(
        { error: 'Too many palette requests. Please slow down.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
      );
    }

    const cacheKey = `colors:${JSON.stringify(input)}`;
    const memoryCached = colorCache.get(cacheKey);
    if (memoryCached) {
      return NextResponse.json({ palette: memoryCached, cached: true, cache: 'memory' }, { headers: CACHE_HEADERS });
    }

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        colorCache.set(cacheKey, cached);
        return NextResponse.json({ palette: cached, cached: true, cache: 'redis' }, { headers: CACHE_HEADERS });
      }
    } catch (err) {
      console.error('[Colors Redis GET Error]', err);
    }

    let res;
    try {
      res = await fetch('http://colormind.io/api/', {
        method: 'POST',
        body: JSON.stringify({ model: 'default', input }),
        signal: AbortSignal.timeout ? AbortSignal.timeout(8_000) : undefined,
      });
    } catch (err) {
      console.error('[Colormind Fetch Error]', err);
      const palette = fallbackPalette(input);
      return NextResponse.json({ palette, cached: false, fallback: true }, { headers: CACHE_HEADERS });
    }

    if (!res.ok) {
      const palette = fallbackPalette(input);
      return NextResponse.json({ palette, cached: false, fallback: true }, { headers: CACHE_HEADERS });
    }

    const data = await res.json();
    const hexPalette = data.result.map((rgb) => rgbToHex(rgb[0], rgb[1], rgb[2]).toUpperCase());

    try {
      colorCache.set(cacheKey, hexPalette);
      await redis.setex(cacheKey, 3600, hexPalette);
    } catch (err) {
      console.error('[Colors Redis SET Error]', err);
    }

    return NextResponse.json({ palette: hexPalette, cached: false }, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error('[Colormind Proxy Error]', error);
    return NextResponse.json({ error: 'Failed to generate palette' }, { status: 500 });
  }
}