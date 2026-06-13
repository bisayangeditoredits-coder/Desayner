require('dotenv').config({ path: '.env.local' });
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function test() {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: 'test.webp',
    ContentType: 'image/webp',
  });
  const uploadUrl = await getSignedUrl(R2, command, { expiresIn: 600 });

  const res = await fetch(uploadUrl, { method: 'OPTIONS', headers: { 'Origin': 'https://desayner.com', 'Access-Control-Request-Method': 'PUT' } });
  console.log('CORS headers for desayner.com:', res.headers.get('access-control-allow-origin'));
}
test();
