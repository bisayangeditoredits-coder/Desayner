'use client';
/**
 * ProgressiveImage — hardened
 *
 * Changes from v1:
 *  - Fixed memory leak: Image load callbacks cancelled and .src cleared on cleanup
 *  - Respects prefers-reduced-motion: no shimmer, no crossfade — shows image directly
 *  - Removed willChange:opacity (burns GPU RAM on low-end devices)
 *  - Only applies transition when actually needed
 *  - Works on all browsers that support Next.js (IE excluded)
 *
 * Props:
 *   src         — full-resolution image URL
 *   thumbnail   — small thumbnail URL (falls back to src if not provided)
 *   alt         — alt text
 *   className   — class names on wrapper div
 *   style       — inline styles on wrapper div
 *   aspectRatio — CSS aspect-ratio (default '4/3')
 */

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

// Read prefers-reduced-motion once at module load time (SSR-safe)
function getPrefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function ProgressiveImage({
  src,
  thumbnail,
  alt = '',
  className = '',
  style = {},
  aspectRatio = '4/3',
}) {
  const effectiveSrc   = src || thumbnail || '';
  const effectiveThumb = thumbnail || src || '';
  const reducedMotion  = getPrefersReducedMotion();

  // States: 'loading' | 'thumb' | 'full'
  // If reduced motion, jump straight to 'full' once image loads (no shimmer phase)
  const [loadState, setLoadState] = useState('loading');
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!effectiveSrc) {
      setLoadState('loading');
      return;
    }

    setLoadState('loading');
    let cancelled = false;

    // ── Load thumbnail first (fast, small file) ────────────────────────────
    const thumbImg = new window.Image();
    thumbImg.onload = () => {
      if (!cancelled && mountedRef.current) {
        setLoadState((prev) => (prev === 'loading' ? 'thumb' : prev));
      }
    };
    // No onerror — failure just keeps showing shimmer until full loads
    thumbImg.src = effectiveThumb;

    // ── Load full image in background ──────────────────────────────────────
    const fullImg = new window.Image();
    fullImg.onload = () => {
      if (!cancelled && mountedRef.current) setLoadState('full');
    };
    fullImg.onerror = () => {
      // Full image failed — stay on thumbnail if we have it
      if (!cancelled && mountedRef.current) setLoadState('thumb');
    };
    fullImg.src = effectiveSrc;

    return () => {
      // Cancel pending callbacks and abort in-flight browser image loads
      cancelled = true;
      thumbImg.onload = null;
      thumbImg.onerror = null;
      fullImg.onload = null;
      fullImg.onerror = null;
      // Setting src to '' cancels any in-flight network request in most browsers
      thumbImg.src = '';
      fullImg.src = '';
    };
  }, [effectiveSrc, effectiveThumb]);

  // ── If reduced motion: just render the img tag directly, no animation ───
  if (reducedMotion) {
    return (
      <div
        className={`progressive-image ${className}`}
        style={{ position: 'relative', overflow: 'hidden', aspectRatio, background: '#f0f0f0', ...style }}
      >
        {effectiveSrc ? (
          <Image
            src={effectiveSrc}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: 'cover' }}
            unoptimized={true}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: '#e8e8e8' }} />
        )}
      </div>
    );
  }

  // ── Standard progressive path ────────────────────────────────────────────
  const showShimmer = loadState === 'loading';
  const showThumb   = loadState === 'thumb' || loadState === 'full';
  const showFull    = loadState === 'full';

  return (
    <div
      className={`progressive-image ${className}`}
      style={{ position: 'relative', overflow: 'hidden', aspectRatio, background: '#f0f0f0', ...style }}
    >
      {/* Shimmer skeleton */}
      {showShimmer && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 37%, #f0f0f0 63%)',
            backgroundSize: '400% 100%',
            animation: 'img-shimmer 1.4s ease infinite',
            zIndex: 0,
          }}
        />
      )}

      {/* Thumbnail — fades out when full is ready */}
      {effectiveThumb && (
        <Image
          src={effectiveThumb}
          alt=""
          aria-hidden="true"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          unoptimized={true}
          style={{
            objectFit: 'cover',
            opacity: showThumb && !showFull ? 1 : 0,
            transition: showFull ? 'opacity 0.3s ease' : 'none',
            zIndex: 1,
          }}
        />
      )}

      {/* Full image — fades in once loaded */}
      {effectiveSrc && (
        <Image
          src={effectiveSrc}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          unoptimized={true}
          style={{
            objectFit: 'cover',
            opacity: showFull ? 1 : 0,
            transition: showFull ? 'opacity 0.3s ease' : 'none',
            zIndex: 2,
          }}
        />
      )}

      <style>{`
        @keyframes img-shimmer {
          0%   { background-position: 100% 50%; }
          100% { background-position: 0%   50%; }
        }
      `}</style>
    </div>
  );
}
