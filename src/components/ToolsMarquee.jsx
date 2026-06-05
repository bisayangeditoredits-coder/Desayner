'use client';

import React from 'react';
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
  return (
    <div className="tools-marquee-container">
      <div className="tools-marquee-track">
        {tools.concat(tools).map((img, i) => (
          <div key={i} className="tool-icon-wrapper" title={img.replace('.png', '')}>
            <Image
              src={`/PNGs/${img}`}
              alt={img.replace('.png', '')}
              width={28}
              height={28}
              className="tool-icon"
              unoptimized
            />
          </div>
        ))}
      </div>
    </div>
  );
}
