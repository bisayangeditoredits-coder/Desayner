'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

function getInitialVisibility() {
  if (typeof window === 'undefined') return false;
  return !localStorage.getItem('cookie_consent');
}

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const check = async () => {
      if (!localStorage.getItem('cookie_consent')) {
        setIsVisible(true);
      }
    };
    check();
  }, []);

  if (!isVisible) return null;

  const acceptCookies = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setIsVisible(false);
  };

  const rejectCookies = () => {
    localStorage.setItem('cookie_consent', 'rejected');
    setIsVisible(false);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      left: '1.5rem',
      maxWidth: '360px',
      background: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '1.25rem',
      boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
      zIndex: 9999,
      fontFamily: 'var(--font-jakarta)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      animation: 'slideUpCookie 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <style>{`
        @keyframes slideUpCookie {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <div style={{ fontSize: '1.25rem', marginTop: '0.1rem' }}>🍪</div>
        <div>
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>Privacy & Terms</h4>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
            By using our platform, you agree to our <Link href="/terms" style={{ color: '#2d43e8', textDecoration: 'none', fontWeight: 600 }}>Terms and Conditions</Link> and <Link href="/privacy" style={{ color: '#2d43e8', textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</Link>. We use essential cookies to keep you logged in.
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
        <button 
          onClick={rejectCookies}
          style={{ 
            flex: 1, 
            background: '#f1f5f9', 
            color: '#475569', 
            border: 'none', 
            padding: '0.6rem', 
            borderRadius: '8px', 
            fontSize: '0.85rem', 
            fontWeight: 700, 
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseOver={e => e.target.style.background = '#e2e8f0'}
          onMouseOut={e => e.target.style.background = '#f1f5f9'}
        >
          Decline
        </button>
        <button 
          onClick={acceptCookies}
          style={{ 
            flex: 1, 
            background: '#0f172a', 
            color: 'white', 
            border: 'none', 
            padding: '0.6rem', 
            borderRadius: '8px', 
            fontSize: '0.85rem', 
            fontWeight: 700, 
            cursor: 'pointer',
            transition: 'background 0.2s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
          onMouseOver={e => e.target.style.background = '#1e293b'}
          onMouseOut={e => e.target.style.background = '#0f172a'}
        >
          Accept All
        </button>
      </div>
    </div>
  );
}
