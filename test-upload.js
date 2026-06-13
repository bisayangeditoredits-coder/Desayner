require('dotenv').config({ path: '.env.local' });
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

async function checkUploadUrl() {
  try {
    const s3 = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });

    const filename = `test_cors_${Date.now()}.webp`;
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: `test/${filename}`,
      ContentType: 'image/webp',
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 });
    console.log('Upload URL:', uploadUrl);

    // Test PUT
    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'image/webp' },
      body: 'test data'
    });
    console.log('PUT Response:', putRes.status, await putRes.text());
  } catch (err) {
    console.error('Error:', err);
  }
}
checkUploadUrl();
