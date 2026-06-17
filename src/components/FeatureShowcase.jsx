'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';

const BANNERS = [
  '/banners/feature-card-1.png',
  '/banners/feature-card-2.png',
  '/banners/feature-card-3.png',
  '/banners/feature-card-4.png',
  '/banners/feature-card-5.png',
  '/banners/feature-card-6.png',
  '/banners/feature-card-7.png',
];

export default function FeatureShowcase() {
  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % BANNERS.length);
    }, 5000); // Change image every 5 seconds
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#020617' }}>
      
      {/* Slow Fading and Scaling Images */}
      {BANNERS.map((src, idx) => (
        <Image
          key={src}
          src={src}
          alt={`Feature ${idx + 1}`}
          fill
          priority={idx === 0}
          sizes="50vw"
          unoptimized
          style={{
            objectFit: 'cover',
            objectPosition: 'center',
            opacity: currentBanner === idx ? 1 : 0,
            transform: currentBanner === idx ? 'scale(1)' : 'scale(1.05)',
            transition: 'opacity 1.5s ease-in-out, transform 6s ease-out',
            zIndex: currentBanner === idx ? 1 : 0,
          }}
        />
      ))}

      {/* Elegant dark gradient overlay to ensure text readability */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.4) 0%, rgba(2, 6, 23, 0.9) 100%)',
        zIndex: 2,
        pointerEvents: 'none'
      }} />
      
    </div>
  );
}
