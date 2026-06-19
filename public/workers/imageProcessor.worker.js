/**
 * imageProcessor.worker.js — hardened for all devices
 *
 * Compatibility strategy:
 *  - Checks for OffscreenCanvas + createImageBitmap at startup
 *  - If unavailable, immediately sends CAPABILITY_ERROR so the hook
 *    falls back to main-thread browser-image-compression (works on iOS 12+)
 *  - 30-second processing timeout to prevent hanging on very old/slow devices
 *  - Proper GPU memory cleanup (bitmap.close())
 *
 * Messages IN:  { type: 'PROCESS', file: File, quality?, maxPx?, thumbPx? }
 * Messages OUT:
 *   { type: 'CAPABILITY_ERROR' }   — browser cannot run this worker
 *   { type: 'PROGRESS', stage, pct: 0–100 }
 *   { type: 'RESULT',   optimized: Blob, thumbnail: Blob, ... }
 *   { type: 'ERROR',    message: string }
 */

// ── Capability check — runs immediately when worker is loaded ───────────────
const HAS_OFFSCREEN  = typeof OffscreenCanvas !== 'undefined';
const HAS_BITMAP     = typeof createImageBitmap !== 'undefined';

if (!HAS_OFFSCREEN || !HAS_BITMAP) {
  // Signal the hook to use the main-thread fallback instead.
  // Don't keep listening — exit cleanly.
  self.addEventListener('message', () => {
    self.postMessage({ type: 'CAPABILITY_ERROR' });
  });
} else {
  // ── Full GPU-accelerated path ──────────────────────────────────────────
  self.addEventListener('message', async (e) => {
    const {
      type,
      file,
      quality = 0.82,
      maxPx   = 2000,
      // Reduced from 500 → 320px: card thumbnails display at 200-280px CSS width.
      // At 320px we fully cover 2× retina screens at card size. Reducing this
      // cuts thumbnail file sizes by ~50%, improving page load times significantly.
      thumbPx = 320,
    } = e.data;
    if (type !== 'PROCESS') return;

    // 30-second safety timeout for very slow devices
    const timeoutId = setTimeout(() => {
      self.postMessage({ type: 'ERROR', message: 'Image processing timed out. Using fallback.' });
    }, 30_000);

    let bitmap = null;
    try {
      // ── 1. Decode ─────────────────────────────────────────────────────────
      postProgress('loading', 8);
      try {
        bitmap = await createImageBitmap(file);
      } catch {
        throw new Error('Could not decode image. Please use JPG, PNG, WebP, or GIF.');
      }

      const { width: origW, height: origH } = bitmap;
      postProgress('loading', 18);

      // ── 2. Optimised image dimensions ──────────────────────────────────────
      const longEdge = Math.max(origW, origH);
      const scale    = longEdge > maxPx ? maxPx / longEdge : 1;
      const optW     = Math.round(origW * scale);
      const optH     = Math.round(origH * scale);

      // ── 3. Draw → optimised WebP ───────────────────────────────────────────
      postProgress('resizing', 32);
      const optCanvas = new OffscreenCanvas(optW, optH);
      const optCtx    = optCanvas.getContext('2d');
      optCtx.drawImage(bitmap, 0, 0, optW, optH);
      postProgress('resizing', 55);

      const optimizedBlob = await optCanvas.convertToBlob({ type: 'image/webp', quality });
      postProgress('resizing', 66);

      // ── 4. Draw → thumbnail WebP ───────────────────────────────────────────
      postProgress('thumbnail', 70);
      const thumbScale = optW > thumbPx ? thumbPx / optW : 1;
      const thumbW     = Math.round(optW * thumbScale);
      const thumbH     = Math.round(optH * thumbScale);

      const thumbCanvas = new OffscreenCanvas(thumbW, thumbH);
      const thumbCtx    = thumbCanvas.getContext('2d');
      thumbCtx.drawImage(optCanvas, 0, 0, thumbW, thumbH);
      postProgress('thumbnail', 87);

      // Quality 0.72 vs 0.75 — imperceptible at 320px card size but ~10% smaller file
      const thumbnailBlob = await thumbCanvas.convertToBlob({ type: 'image/webp', quality: 0.72 });

      clearTimeout(timeoutId);
      postProgress('done', 100);

      self.postMessage({
        type:          'RESULT',
        optimized:     optimizedBlob,
        thumbnail:     thumbnailBlob,
        originalSize:  file.size,
        optimizedSize: optimizedBlob.size,
        thumbnailSize: thumbnailBlob.size,
        dimensions:      { width: optW,   height: optH   },
        thumbDimensions: { width: thumbW, height: thumbH },
      });

    } catch (err) {
      clearTimeout(timeoutId);
      self.postMessage({ type: 'ERROR', message: err.message || 'Unknown processing error' });
    } finally {
      // Always free GPU memory
      if (bitmap) bitmap.close();
    }
  });
}

function postProgress(stage, pct) {
  self.postMessage({ type: 'PROGRESS', stage, pct });
}
