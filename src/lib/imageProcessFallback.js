/**
 * imageProcessFallback.js
 *
 * Main-thread image compression fallback for browsers that do not support
 * OffscreenCanvas or createImageBitmap (iOS Safari < 16.4, old Android
 * WebViews, Samsung Internet < 20, etc.).
 *
 * Uses browser-image-compression (already installed) + a canvas-based
 * thumbnail generator. Runs on the main thread but is fast enough for
 * the file sizes we allow (≤10 MB) and only triggers on old devices.
 */

import imageCompression from 'browser-image-compression';

/**
 * Process a file into an optimised WebP blob and a thumbnail WebP blob.
 * @param {File}     file        — raw input file
 * @param {Function} onProgress  — callback(0–100)
 * @returns {Promise<{ optimizedBlob, thumbnailBlob, stats }>}
 */
export async function processImageFallback(file, onProgress = () => {}) {
  onProgress(5);

  // ── 1. Compress full image ──────────────────────────────────────────────
  const compressedFile = await imageCompression(file, {
    maxSizeMB:        1,
    maxWidthOrHeight: 2000,
    useWebWorker:     false, // avoid double-worker scenario
    fileType:         'image/webp',
    initialQuality:   0.82,
    onProgress:       (p) => onProgress(5 + Math.round(p * 0.55)), // 5 → 60
  });

  onProgress(62);

  // Convert compressed File → Blob
  const optimizedBlob = new Blob([compressedFile], { type: 'image/webp' });

  // ── 2. Generate thumbnail ───────────────────────────────────────────────
  // Reduced from 500 → 320px to match the Worker path.
  // Card thumbnails display at 200-280px CSS width; 320px covers 2× retina.
  const thumbnailBlob = await generateThumbnailFromBlob(optimizedBlob, 320);
  onProgress(95);

  return {
    optimizedBlob,
    thumbnailBlob,
    stats: {
      originalSize:  file.size,
      optimizedSize: optimizedBlob.size,
      thumbnailSize: thumbnailBlob.size,
      savedPct:      Math.max(0, Math.round((1 - optimizedBlob.size / file.size) * 100)),
    },
  };
}

/**
 * Draw a blob onto a canvas and export as a ≤maxWidth-px WebP thumbnail.
 * @param {Blob}   blob
 * @param {number} maxWidth
 * @returns {Promise<Blob>}
 */
function generateThumbnailFromBlob(blob, maxWidth = 500) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const scale = img.naturalWidth > maxWidth ? maxWidth / img.naturalWidth : 1;
      const w     = Math.round(img.naturalWidth  * scale);
      const h     = Math.round(img.naturalHeight * scale);

      const canvas = document.createElement('canvas');
      canvas.width  = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);

      canvas.toBlob(
        (thumbBlob) => {
          if (thumbBlob) resolve(thumbBlob);
          else reject(new Error('Canvas toBlob returned null'));
        },
        // Quality 0.72 — matches worker, imperceptible at card thumbnail size
        'image/webp',
        0.72
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for thumbnail generation'));
    };

    img.src = url;
  });
}
