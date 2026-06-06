'use client';
import { useState } from 'react';
import Image from 'next/image';

function stripCloudinaryProxy(url) {
  if (!url) return url;
  if (typeof url === 'string' && url.includes('res.cloudinary.com') && url.includes('/fetch/')) {
    const match = url.match(/(https?%3A%2F%2F.*|https?:\/\/.*)$/i);
    if (match) {
      try {
        return decodeURIComponent(match[1]);
      } catch (e) {
        return url;
      }
    }
  }
  return url;
}

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
  
  const effectiveSrc   = stripCloudinaryProxy(rawSrc);
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
            <Image
              src={effectiveThumb}
              alt=""
              aria-hidden="true"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              style={{ objectFit: 'cover', filter: 'blur(10px)', opacity: 0.5 }}
            />
          )}
        </div>
      )}

      {/* Main Full Image */}
      {effectiveSrc && (
        <Image
          src={effectiveSrc}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onLoadingComplete={() => setIsLoaded(true)}
          style={{
            objectFit: 'cover',
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
