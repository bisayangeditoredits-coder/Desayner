const fs = require('fs');

async function testUpload() {
  console.log('Testing upload API...');
  
  try {
    // 1. We need to mock a user or just test the R2 presigned URL directly.
    // Wait, the /api/upload route requires authentication (Supabase cookie).
    // Let's just test generating a presigned URL directly using the r2.js library.
    
    // We'll load env vars manually since we're running outside Next.js
    // We'll load env vars natively using node --env-file
    
    // Check if variables exist
    console.log('R2_BUCKET_NAME:', process.env.R2_BUCKET_NAME);
    console.log('R2_PUBLIC_URL:', process.env.R2_PUBLIC_URL);
    
    // If the public URL is still the placeholder, let the user know
    if (process.env.R2_PUBLIC_URL === 'https://your-custom-domain-or-r2-public-url.com') {
      console.log('WARNING: R2_PUBLIC_URL is still the placeholder. Images will upload but broken links will be shown.');
    }

    const { getUploadUrl, getAssetUrl } = await import('./src/lib/storage/r2.js');
    
    const key = `test/robot-test-${Date.now()}.txt`;
    console.log('Generating presigned URL for key:', key);
    
    const uploadUrl = await getUploadUrl(key, 'text/plain');
    console.log('Presigned URL generated successfully.');
    
    // 2. Try to PUT a file to the generated URL
    console.log('Attempting to upload a test file to R2...');
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: 'Hello from the Creldesk test script!'
    });
    
    if (!response.ok) {
      console.error('Upload failed:', response.status, response.statusText);
      const text = await response.text();
      console.error('Response text:', text);
      return;
    }
    
    console.log('Upload successful! Status:', response.status);
    
    const publicUrl = getAssetUrl(key);
    console.log('Public URL:', publicUrl);
    
    // 3. Try to fetch the uploaded file to verify the public URL works
    console.log('Verifying public URL...');
    const verifyRes = await fetch(publicUrl);
    if (verifyRes.ok) {
      console.log('✅ Success! The file was uploaded and is publicly accessible.');
      console.log('Content:', await verifyRes.text());
    } else {
      console.error('❌ Upload worked, but could not fetch from public URL (Status: ' + verifyRes.status + ').');
      console.error('This means your R2_PUBLIC_URL is incorrect or the bucket is not public.');
    }

  } catch (err) {
    console.error('Test failed with error:', err);
  }
}

testUpload();
