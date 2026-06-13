'use client';
/**
 * useUpload.js — hardened for production
 *
 * Full upload pipeline:
 *   File → processImage (Worker OR main-thread fallback) → presigned URL → R2 PUT
 *
 * Hardening:
 *  - Automatic Worker → fallback routing via processImage()
 *  - useEffect cleanup: cancels compression and aborts fetch on unmount
 *  - AbortController for cancellable R2 PUTs
 *  - Auto-retry ×2 on retryable network errors
 *  - Single active upload at a time (guards against double-calls)
 *
 * Returns:
 *   uploadFile(file, folder)
 *   cancel()
 *   retry()
 *   reset()
 *   status: 'idle' | 'compressing' | 'uploading' | 'done' | 'error'
 *   progress: 0–100
 *   result: { publicUrl, thumbnailUrl, key, thumbnailKey } | null
 *   error: string | null
 *   compressionStats: { originalSize, optimizedSize, thumbnailSize, savedPct } | null
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { processImage } from '@/lib/processImage';

const MAX_RETRIES   = 2;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);

export function useUpload() {
  const [status,           setStatus]   = useState('idle');
  const [progress,         setProgress] = useState(0);
  const [result,           setResult]   = useState(null);
  const [error,            setError]    = useState(null);
  const [compressionStats, setStats]    = useState(null);

  // Refs survive re-renders and are safe to use in async callbacks
  const abortRef       = useRef(null);  // AbortController for R2 PUT
  const processCancelRef = useRef(null);// cancel() from processImage
  const lastArgs       = useRef(null);  // { file, folder } for retry
  const retryCount     = useRef(0);
  const mountedRef     = useRef(true);  // guards setState after unmount

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      processCancelRef.current?.();  // abort compression
      abortRef.current?.abort();     // abort in-flight R2 PUT
    };
  }, []);

  // ── Safe setState wrappers ─────────────────────────────────────────────────
  const safeSet = (fn) => { if (mountedRef.current) fn(); };

  const reset = useCallback(() => {
    processCancelRef.current?.();
    abortRef.current?.abort();
    safeSet(() => {
      setStatus('idle');
      setProgress(0);
      setResult(null);
      setError(null);
      setStats(null);
    });
    retryCount.current = 0;
  }, []);

  const cancel = useCallback(() => {
    processCancelRef.current?.();
    abortRef.current?.abort();
    safeSet(() => {
      setStatus('idle');
      setProgress(0);
    });
  }, []);

  const uploadFile = useCallback(async (file, folder = 'uploads') => {
    if (!file) return;

    // ── Validate ─────────────────────────────────────────────────────────────
    if (file.size > MAX_FILE_SIZE) {
      safeSet(() => {
        setError(`File too large. Max 10 MB (yours: ${(file.size / 1024 / 1024).toFixed(1)} MB).`);
        setStatus('error');
      });
      return;
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      safeSet(() => {
        setError('Unsupported file type. Please use JPG, PNG, WebP, GIF, or AVIF.');
        setStatus('error');
      });
      return;
    }

    lastArgs.current = { file, folder };
    safeSet(() => {
      setStatus('compressing');
      setProgress(5);
      setError(null);
      setResult(null);
    });

    try {
      // ── Step 1: Compression (Worker or fallback) ────────────────────────────
      const { promise, cancel: cancelProcess } = processImage(file, (workerPct) => {
        // Worker progress 0–100 → combined bar 5–50
        safeSet(() => setProgress(5 + Math.round(workerPct * 0.45)));
      });
      processCancelRef.current = cancelProcess;

      const { optimizedBlob, thumbnailBlob, stats } = await promise;
      processCancelRef.current = null;

      if (!mountedRef.current) return; // unmounted during compression

      safeSet(() => {
        setStats(stats);
        setStatus('uploading');
        setProgress(52);
      });

      // ── Step 2: Upload to backend via FormData ──────────────────────────────
      abortRef.current = new AbortController();
      const { signal } = abortRef.current;

      const formData = new FormData();
      formData.append('cover', optimizedBlob, 'cover.webp');
      formData.append('thumb', thumbnailBlob, 'thumb.webp');
      formData.append('folder', folder);

      const urlRes = await fetch('/api/upload', {
        method:  'POST',
        body: formData,
        signal,
      });

      if (!urlRes.ok) {
        const errData = await urlRes.json().catch(() => ({}));
        throw new Error(errData.error || `Server error (${urlRes.status})`);
      }

      const { publicUrl, thumbnailUrl, key, thumbnailKey } = await urlRes.json();
      if (!mountedRef.current) return;

      retryCount.current = 0;
      safeSet(() => {
        setProgress(100);
        setStatus('done');
        setResult({ publicUrl, thumbnailUrl, key, thumbnailKey });
      });

    } catch (err) {
      if (!mountedRef.current) return;
      if (err.name === 'AbortError') return; // user cancelled — leave as idle

      // Auto-retry on transient network errors
      if (retryCount.current < MAX_RETRIES && isNetworkError(err)) {
        retryCount.current += 1;
        console.warn(`[useUpload] Retry ${retryCount.current}/${MAX_RETRIES}:`, err.message);
        await delay(1000 * retryCount.current);
        if (mountedRef.current) return uploadFile(file, folder);
        return;
      }

      safeSet(() => {
        setError(err.message || 'Upload failed. Please try again.');
        setStatus('error');
      });
    }
  }, []);

  const retry = useCallback(() => {
    if (!lastArgs.current) return;
    retryCount.current = 0;
    uploadFile(lastArgs.current.file, lastArgs.current.folder);
  }, [uploadFile]);

  return { status, progress, result, error, compressionStats, uploadFile, cancel, retry, reset };
}

// ── Utilities ──────────────────────────────────────────────────────────────
function isNetworkError(err) {
  if (err.name === 'TypeError') return true; // fetch() network failure
  const msg = err.message?.toLowerCase() || '';
  return msg.includes('network') || msg.includes('failed to fetch') || msg.includes('load failed');
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
