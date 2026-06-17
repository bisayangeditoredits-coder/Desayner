'use client';
import { useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import './HorizontalFeatureScroll.css';

const FEATURES = [
  {
    src: '/banners/feature-card-1.png',
    title: 'Build Your Portfolio',
    description: 'Create a stunning, professional portfolio in minutes with our beautifully designed templates.'
  },
  {
    src: '/banners/feature-card-2.png',
    title: 'Build Your Brand',
    description: 'Grow your audience and establish your unique creative identity on the fastest growing design platform.'
  },
  {
    src: '/banners/feature-card-3.png',
    title: 'Join The Community',
    description: 'Connect, collaborate, and share feedback with top-tier creative professionals worldwide.'
  },
  {
    src: '/banners/feature-card-4.png',
    title: 'Get Discovered',
    description: 'Showcase your best work and attract high-paying clients looking for your specific creative style.'
  },
  {
    src: '/banners/feature-card-5.png',
    title: 'Advanced Analytics',
    description: 'Track your profile views, project engagement, and audience demographics in real-time.'
  },
  {
    src: '/banners/feature-card-6.png',
    title: 'Creative Challenges',
    description: 'Participate in weekly design challenges to sharpen your skills and win amazing prizes.'
  },
  {
    src: '/banners/feature-card-7.png',
    title: 'Monetize Your Skills',
    description: 'Sell digital assets, templates, courses, and premium resources directly to your followers.'
  }
];

export default function HorizontalFeatureScroll() {
  const [selectedFeature, setSelectedFeature] = useState(null);

  const renderCards = (ariaHidden = false) => (
    <div className="marquee-group" aria-hidden={ariaHidden ? "true" : undefined}>
      {FEATURES.map((feature, i) => (
        <div 
          key={i} 
          className="feature-card-hover"
          onClick={() => setSelectedFeature(feature)}
        >
          <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#ffffff', borderBottom: '1px solid #f1f5f9' }}>
            <img 
              src={feature.src} 
              alt={feature.title} 
              style={{ objectFit: 'cover', width: '100%', height: '100%', position: 'absolute', inset: 0 }} 
              loading="eager"
            />
          </div>
          
          <div style={{ padding: '1.25rem' }}>
            <h4 style={{ 
              fontSize: '1.05rem', 
              fontWeight: 800, 
              color: '#0f172a', 
              marginBottom: '0.4rem',
              letterSpacing: '-0.01em'
            }}>
              {feature.title}
            </h4>
            <p style={{ 
              fontSize: '0.85rem', 
              color: '#64748b', 
              lineHeight: 1.5,
              margin: 0
            }}>
              {feature.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ marginBottom: '3rem', overflow: 'hidden' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem', marginBottom: '1.25rem', textAlign: 'center' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
          Everything You Need to Succeed
        </h3>
      </div>
      
      <div className="feature-marquee-container">
        <div className="feature-marquee-track-v2">
          {renderCards(false)}
          {renderCards(true)}
        </div>
      </div>

      {selectedFeature && (
        <div className="feature-modal-overlay">
          <div className="feature-modal-container">
            
            {/* Left Side: Text Content */}
            <div className="feature-modal-left">
              <h2 style={{ fontSize: '2.5rem', fontWeight: 900, margin: '0 0 1rem 0', lineHeight: 1.1, color: '#0f172a' }}>
                {selectedFeature.title}
              </h2>
              
              <p style={{ fontSize: '0.95rem', color: '#64748b', lineHeight: 1.6, marginBottom: '2rem' }}>
                {selectedFeature.description}
              </p>

              <div>
                <button 
                  onClick={() => setSelectedFeature(null)}
                  style={{
                    background: '#2d43e8',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.85rem 2rem',
                    borderRadius: 30,
                    fontWeight: 800,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    boxShadow: '0 8px 16px rgba(45,67,232,0.25)',
                    transition: 'transform 0.15s, box-shadow 0.15s'
                  }}
                  onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  Awesome!
                </button>
              </div>
            </div>

            {/* Right Side: Image */}
            <div className="feature-modal-right">
              <button 
                className="feature-modal-close" 
                onClick={() => setSelectedFeature(null)} 
                aria-label="Close modal"
              >
                <X size={18} color="#231f20" />
              </button>
              <img 
                src={selectedFeature.src} 
                alt={selectedFeature.title} 
                style={{ 
                  objectFit: 'cover',
                  objectPosition: 'center',
                  width: '100%',
                  height: '100%',
                  position: 'absolute',
                  inset: 0
                }}
              />
            </div>

            {/* Mobile close button (only visible on small screens where right side is hidden) */}
            <button 
              className="feature-modal-close" 
              onClick={() => setSelectedFeature(null)} 
              style={{ right: '1rem', color: 'white', background: 'rgba(0,0,0,0.2)' }}
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
