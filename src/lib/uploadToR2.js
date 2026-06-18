/**
 * Upload pre-compressed WebP blobs via presigned R2 PUT URLs.
 */
export async function uploadProcessedImages(folder, optimizedBlob, thumbnailBlob) {
  const urlRes = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder }),
  });

  if (!urlRes.ok) {
    const errData = await urlRes.json().catch(() => ({}));
    throw new Error(errData.error || `Server error (${urlRes.status})`);
  }

  const { coverUploadUrl, thumbUploadUrl, publicUrl, thumbnailUrl } = await urlRes.json();

  const [coverRes, thumbRes] = await Promise.all([
    fetch(coverUploadUrl, {
      method: 'PUT',
      body: optimizedBlob,
      headers: { 'Content-Type': 'image/webp' },
    }),
    fetch(thumbUploadUrl, {
      method: 'PUT',
      body: thumbnailBlob,
      headers: { 'Content-Type': 'image/webp' },
    }),
  ]);

  if (!coverRes.ok) throw new Error('Cover upload failed');
  if (!thumbRes.ok) throw new Error('Thumbnail upload failed');

  return { publicUrl, thumbnailUrl };
}
