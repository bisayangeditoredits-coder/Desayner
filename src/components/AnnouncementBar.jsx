'use client';
import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isDismissed = sessionStorage.getItem('announcement-dismissed');
    if (!isDismissed) {
      setIsVisible(true);
    }
  }, []);

  if (!isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('announcement-dismissed', 'true');
  };

  return (
    <div style={{
      background: 'linear-gradient(90deg, #1e1b4b 0%, #2d43e8 50%, #1e1b4b 100%)',
      color: 'white',
      padding: '0.6rem 1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      zIndex: 1000,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
        <Sparkles size={14} style={{ color: '#fbbf24' }} />
        <span>Join the upcoming Desayner Community Event! Connect with top creatives worldwide.</span>
        <Link 
          href="/contests" 
          style={{ 
            color: '#fbbf24', 
            textDecoration: 'underline', 
            marginLeft: '0.5rem',
            fontWeight: 700 
          }}
        >
          Learn more
        </Link>
      </div>
      
      <button 
        onClick={handleDismiss}
        style={{
          position: 'absolute',
          right: '1rem',
          background: 'transparent',
          border: 'none',
          color: 'rgba(255, 255, 255, 0.8)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px',
          borderRadius: '50%',
          transition: 'background 0.2s, color 0.2s',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
          e.currentTarget.style.color = 'white';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
        }}
        aria-label="Dismiss announcement"
      >
        <X size={14} />
      </button>
    </div>
  );
}
