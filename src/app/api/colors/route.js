import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@/lib/redis';

export const runtime = 'edge';

const colorRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '60 s'),
  analytics: false,
  prefix: 'rl:colors',
});

function normalizeInput(input) {
  if (!Array.isArray(input) || input.length !== 5) {
    return ["N", "N", "N", "N", "N"];
  }

  return input.map((item) => {
    if (item === 'N') return 'N';
    if (!Array.isArray(item) || item.length !== 3) return 'N';
    const rgb = item.map((value) => Number(value));
    if (rgb.some((value) => !Number.isInteger(value) || value < 0 || value > 255)) return 'N';
    return rgb;
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const input = normalizeInput(body.input);
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
      || request.headers.get('x-real-ip')
      || '127.0.0.1';

    const { success, remaining } = await colorRatelimit.limit(`ip:${ip}`);
    if (!success) {
      return NextResponse.json(
        { error: 'Too many palette requests. Please slow down.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
      );
    }

    const cacheKey = `colors:${JSON.stringify(input)}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json(
          { palette: cached, cached: true },
          { headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' } }
        );
      }
    } catch (err) {
      console.error('[Colors Redis GET Error]', err);
    }

    // Proxy to Colormind API to bypass HTTPS/CORS issues in production
    const res = await fetch('http://colormind.io/api/', {
      method: 'POST',
      body: JSON.stringify({
        model: 'default',
        input: input
      }),
    });

    if (!res.ok) {
      throw new Error(`Colormind API error: ${res.status}`);
    }

    const data = await res.json();
    
    // Colormind returns an array of RGB arrays: [[r,g,b], [r,g,b], ...]
    // We convert them to Hex codes
    const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');

    const hexPalette = data.result.map(rgb => rgbToHex(rgb[0], rgb[1], rgb[2]).toUpperCase());

    try {
      await redis.setex(cacheKey, 3600, hexPalette);
    } catch (err) {
      console.error('[Colors Redis SET Error]', err);
    }

    return NextResponse.json(
      { palette: hexPalette, cached: false },
      { headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' } }
    );
  } catch (error) {
    console.error('[Colormind Proxy Error]', error);
    return NextResponse.json({ error: 'Failed to generate palette' }, { status: 500 });
  }
}
