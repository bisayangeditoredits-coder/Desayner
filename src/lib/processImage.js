'use client';
/**
 * processImage.js
 *
 * Smart image processing router — tries the GPU-accelerated Web Worker
 * first, then falls back to main-thread browser-image-compression if:
 *  - OffscreenCanvas is not supported (iOS < 16.4, old Android WebView)
 *  - createImageBitmap is not supported
 *  - Worker fails to load (CSP, network error)
 *  - Worker reports CAPABILITY_ERROR
 *
 * Capability result is cached in module scope (checked once per session).
 *
 * Usage:
 *   const { promise, cancel } = processImage(file, onProgress);
 *   const { optimizedBlob, thumbnailBlob, stats } = await promise;
 *   // Call cancel() to abort mid-process
 */

import { processImageFallback } from './imageProcessFallback';

const WORKER_PATH = '/workers/imageProcessor.worker.js';

// Module-level cache: null = unchecked, true = capable, false = use fallback
let _workerCapable = null;

/**
 * Process an image file with automatic Worker/fallback routing.
 * Returns { promise, cancel } so the caller can abort mid-process.
 */
export function processImage(file, onProgress = () => {}) {
  // Already know worker can't run → go straight to fallback
  if (_workerCapable === false || typeof Worker === 'undefined') {
    let cancelled = false;
    const promise = processImageFallback(file, (p) => { if (!cancelled) onProgress(p); });
    return {
      promise,
      cancel: () => { cancelled = true; },
    };
  }

  // Try Worker path with automatic fallback on failure
  let worker = null;
  let cancelled = false;

  const promise = new Promise((resolve, reject) => {
    try {
      worker = new Worker(WORKER_PATH);
    } catch {
      // Worker constructor itself failed (very old browser or strict CSP)
      _workerCapable = false;
      processImageFallback(file, (p) => { if (!cancelled) onProgress(p); })
        .then(resolve).catch(reject);
      return;
    }

    worker.addEventListener('message', async (e) => {
      if (cancelled) { worker.terminate(); return; }

      const {
        type, pct,
        optimized, thumbnail,
        originalSize, optimizedSize, thumbnailSize,
        message,
      } = e.data;

      switch (type) {
        case 'CAPABILITY_ERROR':
          // Worker loaded but OffscreenCanvas / createImageBitmap missing
          _workerCapable = false;
          worker.terminate();
          worker = null;
          try {
            const result = await processImageFallback(file, (p) => { if (!cancelled) onProgress(p); });
            if (!cancelled) resolve(result);
          } catch (err) {
            if (!cancelled) reject(err);
          }
          break;

        case 'PROGRESS':
          _workerCapable = true; // confirmed working
          if (!cancelled) onProgress(pct);
          break;

        case 'RESULT':
          _workerCapable = true;
          worker.terminate();
          worker = null;
          if (!cancelled) {
            resolve({
              optimizedBlob: optimized,
              thumbnailBlob: thumbnail,
              stats: {
                originalSize,
                optimizedSize,
                thumbnailSize,
                savedPct: Math.max(0, Math.round((1 - optimizedSize / originalSize) * 100)),
              },
            });
          }
          break;

        case 'ERROR':
          worker.terminate();
          worker = null;
          if (!cancelled) reject(new Error(message || 'Worker processing error'));
          break;

        default:
          break;
      }
    });

    worker.addEventListener('error', async (e) => {
      if (cancelled) return;
      // Worker script itself errored (syntax error, load error) → fallback
      _workerCapable = false;
      worker = null;
      try {
        const result = await processImageFallback(file, (p) => { if (!cancelled) onProgress(p); });
        if (!cancelled) resolve(result);
      } catch (err) {
        if (!cancelled) reject(err);
      }
    });

    worker.postMessage({ type: 'PROCESS', file });
  });

  return {
    promise,
    cancel: () => {
      cancelled = true;
      worker?.terminate();
      worker = null;
    },
  };
}
