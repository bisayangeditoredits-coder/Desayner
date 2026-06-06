'use client';
import React from 'react';
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

export default function UserAvatar({ src, name = '', size = 32, className = '' }) {
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
    background: '#0a0a0a',
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

  if (effectiveSrc) {
    return (
      <div style={{ ...style, position: 'relative' }} className={className}>
        <Image src={effectiveSrc} alt={name} fill sizes={`${size}px`} style={{ objectFit: 'cover' }} />
      </div>
    );
  }

  return (
    <div style={style} className={className}>
      <span>{initials}</span>
    </div>
  );
}
