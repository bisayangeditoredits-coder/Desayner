'use client';
import { useState } from 'react';
import { stripCloudinaryProxy } from '@/lib/utils';

const fillStyle = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

export default function ProgressiveImage({
  src,
  thumbnail,
  alt = '',
  className = '',
  style = {},
  aspectRatio = '4/3',
}) {
  const rawSrc = src || thumbnail || '';
  const rawThumb = thumbnail || src || '';

  const effectiveSrc = stripCloudinaryProxy(rawSrc);
  const effectiveThumb = stripCloudinaryProxy(rawThumb);

  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div
      className={`progressive-image ${className}`}
      style={{ position: 'relative', overflow: 'hidden', aspectRatio, background: '#f0f0f0', ...style }}
    >
      {/* Shimmer / Thumbnail placeholder layer */}
      {!isLoaded && (
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
        >
          {effectiveThumb && effectiveThumb !== effectiveSrc && (
            <img
              src={effectiveThumb}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              style={{ ...fillStyle, filter: 'blur(10px)', opacity: 0.5 }}
            />
          )}
        </div>
      )}

      {/* Main Full Image */}
      {effectiveSrc && (
        <img
          src={effectiveSrc}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          style={{
            ...fillStyle,
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.4s ease-in-out',
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
