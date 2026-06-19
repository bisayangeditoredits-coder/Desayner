'use client';

import React, { useRef } from 'react';
// next/image removed — ToolsMarquee displays 12 tool icons duplicated for seamless
// scrolling (24 <Image> nodes total). Each visit triggered 24 Vercel Image Optimization
// transformation slots. These are small local PNGs (36×36px) that need zero server-side
// resizing — a plain <img> is faster and costs nothing.
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

  // Duplicate the list of tools to ensure it spans enough width for smooth seamless looping
  const duplicatedTools = [...tools, ...tools];

  return (
    <div 
      className="tools-marquee-container"
      ref={containerRef}
    >
      <div 
        className="tools-marquee-track"
        ref={trackRef}
      >
        <div className="marquee-content-group">
          {duplicatedTools.map((img, i) => (
            <div key={`g1-${i}`} className="tool-icon-wrapper" title={img.replace('.png', '')}>
              <img
                src={`/PNGs/${img}`}
                alt={img.replace('.png', '')}
                width={36}
                height={36}
                loading="lazy"
                decoding="async"
                className="tool-icon"
              />
            </div>
          ))}
        </div>
        <div className="marquee-content-group" aria-hidden="true">
          {duplicatedTools.map((img, i) => (
            <div key={`g2-${i}`} className="tool-icon-wrapper" title={img.replace('.png', '')}>
              <img
                src={`/PNGs/${img}`}
                alt={img.replace('.png', '')}
                width={36}
                height={36}
                loading="lazy"
                decoding="async"
                className="tool-icon"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


