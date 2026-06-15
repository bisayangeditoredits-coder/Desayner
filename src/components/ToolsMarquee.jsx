'use client';

import React, { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import './ToolsMarquee.css';

const tools = [
  'Photoshop.png',
  'Illustrator.png',
  'Figma.png',
  'after effects.png',
  'premiere.png',
  'Lightroom.png',
  'Canva.png',
  'Framer.png',
  'Blender.png',
  'xd.png',
  'indesign.png',
  'Sketch.png'
];

export default function ToolsMarquee() {
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const positionRef = useRef(0);

  // Duplicate the list of tools to ensure it spans enough width for smooth seamless looping
  const duplicatedTools = [...tools, ...tools];

  useEffect(() => {
    let animationFrameId;
    let lastTime = performance.now();

    const animate = (time) => {
      // Cap delta at 100ms to avoid huge jumps on tab switch/wake from sleep
      const delta = Math.min(time - lastTime, 100);
      lastTime = time;

      if (!isHovered && trackRef.current) {
        const halfWidth = trackRef.current.scrollWidth / 2;
        if (halfWidth > 0) {
          // Speed: 35 pixels per second (0.035px per millisecond)
          // This ensures a very slow, premium, gentle crawl (Mac-like smooth)
          positionRef.current -= 0.035 * delta;
          
          if (Math.abs(positionRef.current) >= halfWidth) {
            positionRef.current = positionRef.current + halfWidth;
          }
          trackRef.current.style.transform = `translate3d(${positionRef.current}px, 0px, 0px)`;
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isHovered]);

  return (
    <div 
      className="tools-marquee-container"
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className="tools-marquee-track"
        ref={trackRef}
      >
        <div className="marquee-content-group">
          {duplicatedTools.map((img, i) => (
            <div key={`g1-${i}`} className="tool-icon-wrapper" title={img.replace('.png', '')}>
              <Image
                src={`/PNGs/${img}`}
                alt={img.replace('.png', '')}
                width={36}
                height={36}
                className="tool-icon"
              />
            </div>
          ))}
        </div>
        <div className="marquee-content-group" aria-hidden="true">
          {duplicatedTools.map((img, i) => (
            <div key={`g2-${i}`} className="tool-icon-wrapper" title={img.replace('.png', '')}>
              <Image
                src={`/PNGs/${img}`}
                alt={img.replace('.png', '')}
                width={36}
                height={36}
                className="tool-icon"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


