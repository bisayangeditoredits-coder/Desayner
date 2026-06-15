import { S3Client } from '@aws-sdk/client-s3';

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


