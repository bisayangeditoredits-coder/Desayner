import { NextResponse } from 'next/server';
import { createMemoryCache } from '@/lib/memoryCache';

export const runtime = 'edge';

// --- MATH GENERATOR (For Explore Grid) ---

function hslToHex(h, s, l) {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

const randomRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function generateAestheticPalette(colorCount = 5, forcedHue = null) {
  const baseHue = forcedHue !== null ? forcedHue + randomRange(-15, 15) : randomRange(0, 360);
  const baseSat = randomRange(60, 90);
  
  const harmonies = [
    () => Array.from({ length: colorCount }, (_, i) => 
      hslToHex((baseHue + (i * 30)) % 360, baseSat, 40 + (i * (40 / colorCount)))
    ),
    () => Array.from({ length: colorCount }, (_, i) => 
      hslToHex(baseHue, baseSat, 20 + (i * (70 / colorCount)))
    ),
    () => Array.from({ length: colorCount }, (_, i) => 
      hslToHex((baseHue + (i * (120 / (colorCount - 1 || 1)))) % 360, baseSat, 50 + (i % 2 === 0 ? 10 : -10))
    ),
    () => Array.from({ length: colorCount }, (_, i) => 
      hslToHex((baseHue + (i * 75)) % 360, baseSat - (i * 5), 60 + (i % 2 === 0 ? 20 : 0))
    )
  ];

  const colors = harmonies[Math.floor(Math.random() * harmonies.length)]();
  
  const hueNames = {
    0: 'Red', 30: 'Orange', 60: 'Yellow', 90: 'Lime', 120: 'Green', 
    150: 'Teal', 180: 'Cyan', 210: 'Azure', 240: 'Blue', 270: 'Violet', 
    300: 'Magenta', 330: 'Pink', 360: 'Red'
  };
  const roundedHue = Math.round(baseHue / 30) * 30;
  const baseName = hueNames[roundedHue] || 'Color';
  
  const adjectives = ['Deep', 'Soft', 'Vibrant', 'Retro', 'Neon', 'Pastel', 'Muted', 'Electric', 'Warm', 'Cool'];
  const title = `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${baseName}`;

  return {
    id: Math.random().toString(36).substring(7),
    title: title,
    userName: 'Desayner AI',
    colors: colors
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const colorCount = parseInt(searchParams.get('colors') || '5', 10);
  const hueParam = searchParams.get('hue');
  const perPage = 40;

  let forcedHue = null;
  if (hueParam && hueParam.toLowerCase() !== 'all') {
    const hueMap = {
      red: 0, orange: 30, yellow: 60, lime: 90, green: 120,
      teal: 150, cyan: 180, azure: 210, blue: 240, violet: 270,
      magenta: 300, pink: 330
    };
    forcedHue = hueMap[hueParam.toLowerCase()] ?? null;
  }

  try {
    const palettes = Array.from({ length: perPage }, () => generateAestheticPalette(colorCount, forcedHue));
    return NextResponse.json(
      { palettes: palettes },
      {
        headers: {
          'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('[Explore Colors Generator Error]', error);
    return NextResponse.json({ error: 'Failed to generate palettes' }, { status: 500 });
  }
}

import { redis } from '@/lib/redis';

// --- COLOR MIND API (For AI Panel) ---

function rgbToHex([r, g, b]) {
  return [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}

const ADJECTIVES = ['Silk', 'Muted', 'Vibrant', 'Retro', 'Neon', 'Pastel', 'Electric', 'Warm', 'Cool', 'Deep', 'Soft', 'Vivid'];
const NOUNS = ['Horizon', 'Drift', 'Glow', 'Bloom', 'Pulse', 'Echo', 'Haze', 'Dusk', 'Dawn', 'Tide', 'Spark', 'Shade'];
function randomName() {
  return `${ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]} ${NOUNS[Math.floor(Math.random() * NOUNS.length)]}`;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { model = 'default', input, count = 5 } = body;

    if (!input || !Array.isArray(input)) {
      return NextResponse.json({ error: 'input array required' }, { status: 400 });
    }

    const cacheKey = `colormind:${model}:${JSON.stringify(input)}:${count}`;
    
    // 1. Try Redis cache first to avoid hitting Colormind API
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        // Generate new ID and title so UI treats it as a fresh generation
        cached.id = Math.random().toString(36).slice(2, 9);
        cached.title = randomName();
        return NextResponse.json({ palette: cached }, { headers: { 'Cache-Control': 'no-store' } });
      }
    } catch (err) {
      console.error('[Colormind Redis GET Error]', err);
    }

    // 2. Fetch from Colormind if cache miss
    const res = await fetch('http://colormind.io/api/', {
      method: 'POST',
      body: JSON.stringify({ model, input: input.slice(0, 5) }), // Colormind expects max 5
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) throw new Error(`Colormind ${res.status}`);
    const { result } = await res.json();
    
    // Trim to requested count if user asked for fewer than 5
    const finalColors = result.slice(0, count).map(rgb => rgbToHex(rgb));

    const palette = {
      id: Math.random().toString(36).slice(2, 9),
      title: randomName(),
      colors: finalColors,
    };

    // 3. Save result to Redis for 24 hours
    try {
      await redis.setex(cacheKey, 86400, palette);
    } catch (err) {
      console.error('[Colormind Redis SET Error]', err);
    }

    return NextResponse.json({ palette }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[Colormind POST Error]', error);
    return NextResponse.json({ error: 'Failed to generate palette' }, { status: 500 });
  }
}
