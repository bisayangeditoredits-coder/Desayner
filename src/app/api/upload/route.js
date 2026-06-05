/**
 * POST /api/upload
 *
 * Upgraded upload route:
 *  - Rate limited via Upstash Redis (20 uploads / user / 60 s)
 *  - Returns presigned URLs for BOTH the optimized image AND the thumbnail
 *  - Only accepts image/webp (client-side worker always converts)
 *  - Tracks errors with Sentry
 *  - Unique keys via UUID: folder/userId/uuid.webp
 */

import { getUploadUrl, getAssetUrl } from '@/lib/storage/r2';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { redis } from '@/lib/redis';
import { Ratelimit } from '@upstash/ratelimit';
import * as Sentry from '@sentry/nextjs';

// 20 uploads per user per 60 seconds
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '60 s'),
  analytics: false,
  prefix: 'rl:upload',
});

const ALLOWED_TYPES = ['image/webp'];

export async function POST(request) {
  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Rate limit ──────────────────────────────────────────────────────────
    const { success, remaining } = await ratelimit.limit(`user:${user.id}`);
    if (!success) {
      return NextResponse.json(
        { error: 'Too many uploads. Please wait a moment before uploading again.' },
        {
          status: 429,
          headers: { 'X-RateLimit-Remaining': String(remaining) },
        }
      );
    }

    // ── Parse & validate body ───────────────────────────────────────────────
    const body = await request.json();
    const {
      filename          = 'image.webp',
      thumbnailFilename = 'thumb.webp',
      contentType       = 'image/webp',
      folder            = 'uploads',
    } = body;

    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: `File type "${contentType}" is not allowed. Client must convert to WebP before uploading.` },
        { status: 400 }
      );
    }

    // ── Generate unique keys ────────────────────────────────────────────────
    const uid          = uuidv4();
    const thumbUid     = uuidv4();
    const key          = `${folder}/${user.id}/${uid}.webp`;
    const thumbnailKey = `${folder}/thumbs/${user.id}/${thumbUid}.webp`;

    // ── Get presigned URLs for both blobs ───────────────────────────────────
    const [uploadUrl, thumbnailUploadUrl] = await Promise.all([
      getUploadUrl(key, 'image/webp'),
      getUploadUrl(thumbnailKey, 'image/webp'),
    ]);

    const publicUrl    = getAssetUrl(key);
    const thumbnailUrl = getAssetUrl(thumbnailKey);

    return NextResponse.json({
      uploadUrl,
      thumbnailUploadUrl,
      publicUrl,
      thumbnailUrl,
      key,
      thumbnailKey,
    });

  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'api/upload' } });
    console.error('[api/upload]', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
