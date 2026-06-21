'use client';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const closeModal = () => {
    setIsOpen(false);
    localStorage.setItem('hasSeenWelcome', 'true');
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes wm-fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes wm-slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }

        .wm-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.82);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          animation: wm-fadeIn 0.3s ease-out;
          isolation: isolate;
        }

        .wm-container {
          position: relative;
          display: flex;
          width: 100%;
          max-width: 860px;
          min-height: 480px;
          max-height: 90vh;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 32px 64px rgba(0, 0, 0, 0.45);
          animation: wm-slideUp 0.4s ease-out;
        }

        /* Single close button — top-right corner of the whole modal */
        .wm-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          z-index: 20;
          background: rgba(0, 0, 0, 0.35);
          border: none;
          color: white;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s;
        }
        .wm-close:hover { background: rgba(0, 0, 0, 0.6); }

        .wm-left {
          flex: 0 0 50%;
          width: 50%;
          background: linear-gradient(135deg, #2d43e8 0%, #1a22ff 100%);
          padding: 3rem 2.5rem;
          color: white;
          display: flex;
          flex-direction: column;
          justify-content: center;
          box-sizing: border-box;
          overflow: hidden;
        }

        .wm-right {
          flex: 0 0 50%;
          width: 50%;
          position: relative;
          background: #111;
          overflow: hidden;
        }

        .wm-right img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center center;
          display: block;
        }

        /* Mobile: hide image, full-width left panel */
        @media (max-width: 640px) {
          .wm-container { flex-direction: column; max-height: 92vh; overflow-y: auto; }
          .wm-left { flex: none; width: 100%; padding: 2.5rem 1.5rem 2rem; }
          .wm-right { display: none; }
          .wm-close { background: rgba(255, 255, 255, 0.2); }
        }
      `}</style>

      {/* Clicking backdrop closes modal */}
      <div className="wm-backdrop" onClick={closeModal}>
        {/* Stop propagation so clicking inside modal doesn't close it */}
        <div className="wm-container" onClick={e => e.stopPropagation()}>

          {/* Single ✕ button — sits over the image in the top-right corner */}
          <button className="wm-close" onClick={closeModal} aria-label="Close welcome modal">
            <X size={16} />
          </button>

          {/* ── Left: text content ─────────────────────────────────────── */}
          <div className="wm-left">
            <div style={{ marginBottom: '1.5rem' }}>
              <img
                src="/desayner-logo-white.png"
                alt="Desayner"
                style={{ width: '160px', height: 'auto' }}
              />
            </div>

            <h2 style={{ fontSize: '2.25rem', fontWeight: 900, margin: '0 0 1rem 0', lineHeight: 1.1 }}>
              Welcome
            </h2>

            <p style={{
              fontSize: '0.875rem',
              color: 'rgba(255,255,255,0.88)',
              lineHeight: 1.65,
              marginBottom: '2rem',
            }}>
              Welcome to Desayner — the creative sanctuary for designers, digital artists, and visionaries.
              Explore our library of free stock photos, generate color palettes, build your portfolio, and
              showcase your work to the world. Your design journey starts right here.
            </p>

            <button
              onClick={closeModal}
              style={{
                alignSelf: 'flex-start',
                background: '#e6e82d',
                color: '#231f20',
                border: 'none',
                padding: '0.85rem 2rem',
                borderRadius: 30,
                fontWeight: 800,
                fontSize: '1rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseOver={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.28)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)';
              }}
            >
              Get Started!
            </button>
          </div>

          {/* ── Right: full-bleed image ────────────────────────────────── */}
          <div className="wm-right">
            <img src="/welcome-image.jpeg" alt="Designers collaborating" />
          </div>

        </div>
      </div>
    </>
  );
}
