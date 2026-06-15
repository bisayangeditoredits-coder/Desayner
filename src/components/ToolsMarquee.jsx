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
              <Image
                src={`/PNGs/${img}`}
                alt={img.replace('.png', '')}
                width={36}
                height={36}
                unoptimized
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
                unoptimized
                className="tool-icon"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


