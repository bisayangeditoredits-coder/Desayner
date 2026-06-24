'use client';
import { useState, useRef, useEffect } from 'react';

const VIDEOS = [
  '/login-page_videos/video-2.mp4',
  '/login-page_videos/video-3.mp4',
  '/login-page_videos/video-4.mp4',
  '/login-page_videos/video-5.mp4',
];

export default function LoginVideoCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRefs = useRef([]);

  // Ensure only the active video is playing
  useEffect(() => {
    videoRefs.current.forEach((video, idx) => {
      if (!video) return;
      if (idx === currentIndex) {
        // Play the active video, handle promise rejection (e.g. autoplay policy)
        video.play().catch(e => console.log('Autoplay prevented:', e));
      } else {
        // Pause others and reset their time so they start from beginning next time
        video.pause();
        video.currentTime = 0;
      }
    });
  }, [currentIndex]);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#020617' }}>
      
      {VIDEOS.map((src, idx) => {
        const isActive = currentIndex === idx;
        
        return (
          <video
            key={src}
            ref={el => videoRefs.current[idx] = el}
            src={src}
            muted
            playsInline
            preload={isActive || idx === 0 ? "auto" : "metadata"}
            onEnded={() => {
              if (isActive) setCurrentIndex((prev) => (prev + 1) % VIDEOS.length);
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: isActive ? 1 : 0,
              // We use transform (scale) and opacity because they are 100% GPU-accelerated
              transform: isActive ? 'scale(1)' : 'scale(1.03)',
              transition: 'opacity 2s ease-in-out, transform 6s linear',
              willChange: 'opacity, transform',
              zIndex: isActive ? 1 : 0,
            }}
          />
        );
      })}

      {/* Elegant dark gradient overlay to ensure text readability */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 100%)',
        zIndex: 2,
        pointerEvents: 'none'
      }} />
    </div>
  );
}
