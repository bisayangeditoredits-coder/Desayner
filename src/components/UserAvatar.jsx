'use client';
import React, { useState, useEffect } from 'react';

import { stripCloudinaryProxy } from '@/lib/utils';

export default function UserAvatar({ src, name = '', size = 32, className = '' }) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [src]);
  const safeName = typeof name === 'string' ? name : String(name || '');
  const initials = safeName
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const style = {
    width: size,
    height: size,
    borderRadius: '50%',
    objectFit: 'cover',
    background: '#231f20',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: size * 0.35,
    fontWeight: 700,
    flexShrink: 0,
    overflow: 'hidden',
  };

  const effectiveSrc = stripCloudinaryProxy(src);
  const showImage =
    effectiveSrc &&
    effectiveSrc !== 'null' &&
    effectiveSrc !== 'undefined' &&
    !imgError;

  if (showImage) {
    return (
      <div style={{ ...style, position: 'relative' }} className={className}>
        <img
          src={effectiveSrc}
          alt={name}
          loading="lazy"
          decoding="async"
          onError={() => setImgError(true)}
          onLoad={(e) => e.currentTarget.classList.add('loaded')}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          className="img-fade-in"
        />
      </div>
    );
  }

  return (
    <div style={style} className={className}>
      <span>{initials}</span>
    </div>
  );
}
