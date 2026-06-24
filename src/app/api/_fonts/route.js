import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export const runtime = 'edge';

// ── Constants ─────────────────────────────────────────────────────────────────
const BUNNY_LIST_URL = 'https://fonts.bunny.net/list';
const CACHE_KEY      = 'bunny_fonts_list_v2';
const CACHE_TTL      = 86400; // 24 hours — font list changes rarely
const PAGE_SIZE      = 24;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convert "plus-jakarta-sans" → "Plus Jakarta Sans" */
function slugToName(slug) {
  return slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Normalize Bunny category names to the 5 standard categories */
function normalizeCategory(cat = '') {
  const c = cat.toLowerCase().replace(/\s+/g, '-');
  if (c.includes('sans'))        return 'sans-serif';
  if (c.includes('serif'))       return 'serif';
  if (c.includes('display'))     return 'display';
  if (c.includes('handwriting') || c.includes('cursive') || c.includes('script')) return 'handwriting';
  if (c.includes('mono'))        return 'monospace';
  return 'sans-serif';
}

/** Fetch full font list from Bunny Fonts and transform to array */
async function fetchAndTransform() {
  const res = await fetch(BUNNY_LIST_URL, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Bunny Fonts API error: ${res.status}`);

  const data = await res.json();

  const fonts = Object.entries(data).map(([slug, meta]) => ({
    slug,
    name:     slugToName(slug),
    category: normalizeCategory(meta.category),
    styles:   meta.styles || [],
    subsets:  meta.defSubset || 'latin',
    version:  meta.version  || '',
  }));

  // Sort alphabetically
  fonts.sort((a, b) => a.name.localeCompare(b.name));
  return fonts;
}

// ── Route Handler ─────────────────────────────────────────────────────────────
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q        = (searchParams.get('q') || '').toLowerCase().trim();
  const category = (searchParams.get('category') || 'all').toLowerCase();
  const page     = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

  // ── 1. Read from Redis cache ──────────────────────────────────────────────
  let allFonts = null;
  try {
    allFonts = await redis.get(CACHE_KEY);
  } catch { /* Redis unavailable — fall through to live fetch */ }

  // ── 2. Cache miss → fetch from Bunny Fonts ────────────────────────────────
  if (!allFonts) {
    try {
      allFonts = await fetchAndTransform();
    } catch (err) {
      console.error('[Fonts API] Bunny fetch failed:', err);
      return NextResponse.json({ error: 'Failed to load font list' }, { status: 500 });
    }
    // Persist to Redis separately so a write failure doesn't kill the response
    try {
      await redis.setex(CACHE_KEY, CACHE_TTL, allFonts);
    } catch (redisErr) {
      console.warn('[Fonts API] Redis write failed, continuing without cache:', redisErr.message);
    }
  }

  // ── 3. Filter ─────────────────────────────────────────────────────────────
  let fonts = allFonts;

  if (q) {
    fonts = fonts.filter(f => f.name.toLowerCase().includes(q));
  }

  if (category !== 'all') {
    fonts = fonts.filter(f => f.category === category);
  }

  const total  = fonts.length;
  const offset = (page - 1) * PAGE_SIZE;
  const slice  = fonts.slice(offset, offset + PAGE_SIZE);

  const isFiltered = !!q || category !== 'all';
  return NextResponse.json(
    { fonts: slice, total, page, hasMore: offset + PAGE_SIZE < total },
    {
      headers: {
        'Cache-Control': isFiltered
          ? 's-maxage=600, stale-while-revalidate=3600'    // 10 min for searches/filters
          : 's-maxage=3600, stale-while-revalidate=86400', // 1 hr for base list
      }
    }
  );
}
