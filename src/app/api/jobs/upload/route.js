import { NextResponse } from 'next/server';
import { R2, BUCKET, getAssetUrl } from '@/lib/storage/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  try {
    const { contentType = 'image/png' } = await request.json();
    const uid = uuidv4();
    const ext = contentType.split('/')[1] || 'png';
    const key = `company-logos/${uid}.${ext}`;

    // Generate a presigned URL that the client can use to upload the logo directly to R2
    const uploadUrl = await getSignedUrl(
      R2, 
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        ContentType: contentType,
      }), 
      { expiresIn: 300 }
    );

    const publicUrl = getAssetUrl(key);

    return NextResponse.json({
      uploadUrl,
      publicUrl,
      key,
    });
  } catch (err) {
    console.error('[api/jobs/upload]', err);
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
  }
}
