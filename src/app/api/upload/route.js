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

import { getAssetUrl } from '@/lib/storage/r2';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { Ratelimit } from '@upstash/ratelimit';
import * as Sentry from '@sentry/nextjs';

export const runtime = 'edge';

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

    // ── Configure R2 Client ────────────────────────────────────────────────
    const R2 = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });
    const BUCKET = process.env.R2_BUCKET_NAME;

    // ── Parse & validate body ───────────────────────────────────────────────
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    const folder = body.folder || 'uploads';

    // ── Generate unique keys ────────────────────────────────────────────────
    const uid          = crypto.randomUUID();
    const thumbUid     = crypto.randomUUID();
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
