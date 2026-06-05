import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Cloudflare R2 Storage Utility
 *
 * Cloudflare R2 is S3-compatible, so we use the AWS SDK pointed at
 * the Cloudflare R2 endpoint instead of AWS servers.
 *
 * Zero egress fees: users are served files directly from Cloudflare's CDN
 * without incurring bandwidth costs per download.
 */

const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME;
const PUBLIC_URL = process.env.R2_PUBLIC_URL;

/**
 * Get the public URL of an asset hosted on R2.
 * @param {string} key - The file key (path) in the R2 bucket.
 * @returns {string} The full public CDN URL.
 */
export function getAssetUrl(key) {
  return `${PUBLIC_URL}/${key}`;
}

/**
 * Generate a pre-signed upload URL so the browser can upload directly
 * to R2 without going through your server (saves bandwidth & cost).
 * URL expires in 10 minutes.
 *
 * @param {string} key - The file key (path) to upload to.
 * @param {string} contentType - MIME type of the file (e.g. 'image/png').
 * @returns {Promise<string>} A pre-signed URL for PUT upload.
 */
export async function getUploadUrl(key, contentType) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(R2, command, { expiresIn: 600 });
}

/**
 * Delete an asset from R2.
 * @param {string} key - The file key (path) in the R2 bucket.
 */
export async function deleteAsset(key) {
  const command = new DeleteObjectCommand({ Bucket: BUCKET, Key: key });
  await R2.send(command);
}
