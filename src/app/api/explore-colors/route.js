import { NextResponse } from 'next/server';

export const runtime = 'edge';

// Helper to convert HSL to HEX
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

// Helper to generate a random number within a range
const randomRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Generate a visually pleasing palette
function generateAestheticPalette(colorCount = 5, forcedHue = null) {
  // Use forced hue or pick a random one
  const baseHue = forcedHue !== null ? forcedHue + randomRange(-15, 15) : randomRange(0, 360);
  const baseSat = randomRange(60, 90);
  
  // We dynamically generate arrays of length `colorCount`
  const harmonies = [
    // Analogous (Hue shifts slowly)
    () => Array.from({ length: colorCount }, (_, i) => 
      hslToHex((baseHue + (i * 30)) % 360, baseSat, 40 + (i * (40 / colorCount)))
    ),
    // Monochromatic (Same hue, varying lightness)
    () => Array.from({ length: colorCount }, (_, i) => 
      hslToHex(baseHue, baseSat, 20 + (i * (70 / colorCount)))
    ),
    // Triadic / Split (Wider hue shifts)
    () => Array.from({ length: colorCount }, (_, i) => 
      hslToHex((baseHue + (i * (120 / (colorCount - 1 || 1)))) % 360, baseSat, 50 + (i % 2 === 0 ? 10 : -10))
    ),
    // Random harmonious jumps
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

  // Map requested hue name to base degree
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
          // Cache this specific combination of page+colorCount on the CDN for 1 hour.
          // This makes the "infinite" random generation completely free at scale.
          'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('[Explore Colors Generator Error]', error);
    return NextResponse.json({ error: 'Failed to generate palettes' }, { status: 500 });
  }
}
