'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowUp } from 'lucide-react';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <>
      <button
        onClick={scrollToTop}
        aria-label="Back to top"
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '24px',
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: '#0f172a',
          color: 'white',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 9998,
          boxShadow: '0 4px 16px rgba(15, 23, 42, 0.18)',
          transition: 'opacity 0.25s ease, transform 0.25s ease',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(12px)',
          pointerEvents: visible ? 'auto' : 'none',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(15, 23, 42, 0.25)';
        }}
        onMouseLeave={e => {
          if (visible) {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(15, 23, 42, 0.18)';
          }
        }}
      >
        <ArrowUp size={18} />
      </button>

      {/* Push toast container up on mobile so they don't overlap */}
      <style>{`
        @media (max-width: 768px) {
          .back-to-top-spacer { display: block; }
        }
      `}</style>
    </>
  );
}
