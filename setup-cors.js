const { S3Client, PutBucketCorsCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

// Basic manual dotenv parsing since we just need 4 variables
const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^#\s=]+)=(.*)$/);
  if (match) env[match[1]] = match[2].trim();
});

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

const command = new PutBucketCorsCommand({
  Bucket: env.R2_BUCKET_NAME,
  CORSConfiguration: {
    CORSRules: [
      {
        AllowedHeaders: ['*'],
        AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
        AllowedOrigins: ['*'], // Allow any origin to upload
        MaxAgeSeconds: 3000
      }
    ]
  }
});

async function run() {
  try {
    await client.send(command);
    console.log('✅ CORS setup successful for bucket:', env.R2_BUCKET_NAME);
  } catch (err) {
    console.error('❌ Failed to set up CORS:', err);
  }
}

run();
