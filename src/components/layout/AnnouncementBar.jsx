'use client';
import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';

export default function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const check = async () => {
      const isDismissed = sessionStorage.getItem('announcement-dismissed');
      if (!isDismissed) {
        setIsVisible(true);
      }
    };
    check();
  }, []);

  if (!isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('announcement-dismissed', 'true');
  };

  return (
    <>
      <style>{`
        .announcement-bar {
          background: linear-gradient(90deg, #1e1b4b 0%, #2d43e8 50%, #1e1b4b 100%);
          color: white;
          padding: 0.6rem 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 1000;
        }
        .announcement-content {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          font-weight: 600;
          padding-right: 1.5rem;
          justify-content: center;
        }
        .announcement-text {
          display: inline;
        }
        .announcement-short-text {
          display: none;
        }
        
        @media (max-width: 600px) {
          .announcement-bar {
            padding: 0.35rem 0.5rem;
          }
          .announcement-content {
            font-size: 0.7rem;
            gap: 0.3rem;
            padding-right: 1.5rem;
          }
          .announcement-text {
            display: none;
          }
          .announcement-short-text {
            display: inline;
          }
        }
      `}</style>
      <div className="announcement-bar">
        <div className="announcement-content">
          <Sparkles size={14} style={{ color: '#fbbf24', flexShrink: 0 }} />
          <span className="announcement-text">Discover top creative professionals for your next big project.</span>
          <span className="announcement-short-text">Find top designers!</span>
          <a
            href="/designers"
            style={{
              color: '#fbbf24',
              textDecoration: 'underline',
              marginLeft: '0.2rem',
              fontWeight: 700,
              whiteSpace: 'nowrap'
            }}
          >
            Explore Designers →
          </a>
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
    </>
  );
}
