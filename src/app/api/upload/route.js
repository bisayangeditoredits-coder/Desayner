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

import { R2, BUCKET, getAssetUrl } from '@/lib/storage/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getServerAuth } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import * as Sentry from '@sentry/nextjs';
import { v4 as uuidv4 } from 'uuid';

// Rate limiter requires a Redis instance WITHOUT enableAutoPipelining
const ratelimitRedis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
  enableAutoPipelining: false,
});

// 20 uploads per user per 60 seconds
const ratelimit = new Ratelimit({
  redis: ratelimitRedis,
  limiter: Ratelimit.slidingWindow(20, '60 s'),
  analytics: false,
  prefix: 'rl:upload',
});

const ALLOWED_TYPES = ['image/webp'];

export async function POST(request) {
  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const { user } = await getServerAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Rate limit ──────────────────────────────────────────────────────────
    try {
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
    } catch (rlError) {
      console.warn('[api/upload] Rate limit check failed, bypassing:', rlError.message);
    }

    // R2 client and BUCKET are imported from @/lib/storage/r2

    // ── Parse & validate body ───────────────────────────────────────────────
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    const folder = body.folder || 'uploads';

    // ── Generate unique keys ────────────────────────────────────────────────
    const uid          = uuidv4();
    const thumbUid     = uuidv4();
    const key          = `${folder}/${user.id}/${uid}.webp`;
    const thumbnailKey = `${folder}/thumbs/${user.id}/${thumbUid}.webp`;

    // ── Generate Presigned URLs ───────────────────────────────────────────────
    const [coverUploadUrl, thumbUploadUrl] = await Promise.all([
      getSignedUrl(R2, new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        ContentType: 'image/webp',
      }), { expiresIn: 300 }),
      getSignedUrl(R2, new PutObjectCommand({
        Bucket: BUCKET,
        Key: thumbnailKey,
        ContentType: 'image/webp',
      }), { expiresIn: 300 }),
    ]);

    const publicUrl    = getAssetUrl(key);
    const thumbnailUrl = getAssetUrl(thumbnailKey);

    return NextResponse.json({
      coverUploadUrl,
      thumbUploadUrl,
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
