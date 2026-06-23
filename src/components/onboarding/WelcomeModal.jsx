'use client';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('hasSeenWelcome');
    if (!seen) {
      const t = setTimeout(() => setIsOpen(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const close = () => {
    setIsOpen(false);
    localStorage.setItem('hasSeenWelcome', 'true');
  };

  if (!isOpen) return null;

  const modalContent = (
    <>
      <style>{`
        @keyframes wm-in  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes wm-up  { from { opacity: 0; transform: translateY(32px); } to { opacity: 1; transform: translateY(0); } }

        .wm-overlay {
          position: fixed; inset: 0; z-index: 100002;
          display: flex; align-items: center; justify-content: center;
          padding: 1rem;
          background: rgba(5, 5, 10, 0.78);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          animation: wm-in 0.25s ease;
          isolation: isolate;
        }

        .wm-card {
          position: relative;
          display: flex;
          width: 100%;
          max-width: 1040px;
          min-height: 600px;
          border-radius: 0;
          overflow: hidden;
          background: #ffffff;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.45);
          animation: wm-up 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }

        /* ══ LEFT MINIMAL PANEL ═══════════════════════ */
        .wm-left {
          flex: 0 0 50%;
          width: 50%;
          background: #ffffff;
          padding: 3.5rem 3.5rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-sizing: border-box;
          overflow: hidden;
        }

        .wm-logo {
          display: flex;
          align-items: center;
        }
        .wm-logo img {
          width: 170px;
          height: auto;
        }

        .wm-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 1.5rem 0;
        }

        .wm-eyebrow {
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #94a3b8;
          margin: 0 0 1.2rem 0;
        }

        .wm-heading {
          font-size: 3.2rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.1;
          letter-spacing: -0.02em;
          margin: 0 0 1.5rem 0;
        }

        .wm-heading em {
          font-style: normal;
          color: #3b82f6;
        }

        .wm-desc {
          font-size: 1rem;
          line-height: 1.6;
          color: #475569;
          margin: 0 0 2rem 0;
          max-width: 95%;
        }

        .wm-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 2rem;
        }

        .wm-pill {
          padding: 0.4rem 0.9rem;
          border-radius: 0;
          background: transparent;
          border: 1px solid #e2e8f0;
          color: #475569;
          font-size: 0.8rem;
          font-weight: 500;
          letter-spacing: 0.02em;
        }

        .wm-footer {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .wm-btn-start {
          flex: 1;
          padding: 1rem 1.2rem;
          background: #2d43e8;
          color: #ffffff;
          border: none;
          border-radius: 0;
          font-weight: 600;
          font-size: 1.05rem;
          font-family: inherit;
          cursor: pointer;
          letter-spacing: 0.02em;
          transition: background 0.2s, transform 0.15s;
        }
        .wm-btn-start:hover {
          background: #1a2ce0;
          transform: translateY(-1px);
        }

        .wm-btn-skip {
          background: transparent;
          border: none;
          color: #94a3b8;
          font-size: 0.95rem;
          font-weight: 500;
          font-family: inherit;
          cursor: pointer;
          padding: 0.75rem;
          transition: color 0.2s;
          white-space: nowrap;
        }
        .wm-btn-skip:hover { color: rgba(255,255,255,0.8); }

        /* ══ RIGHT IMAGE PANEL ═══════════════════════════ */
        .wm-right {
          flex: 0 0 50%;
          width: 50%;
          position: relative;
          overflow: hidden;
          background: #0d0d0d;
        }

        .wm-right img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: 65% center;
          display: block;
        }

        .wm-right-scrim {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(0,0,0,0) 40%,
            rgba(0,0,0,0.55) 100%
          );
          pointer-events: none;
        }

        .wm-right-caption {
          position: absolute;
          bottom: 1.5rem;
          left: 1.5rem;
          right: 1.5rem;
        }

        .wm-caption-box {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.55rem 0.85rem;
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 0;
          color: #fff;
          font-size: 0.75rem;
          font-weight: 500;
        }
        .wm-caption-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #4ade80;
          flex-shrink: 0;
        }

        /* ══ CLOSE ════════════════════════════════════════ */
        .wm-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          z-index: 30;
          width: 32px; height: 32px;
          border-radius: 0;
          background: rgba(0,0,0,0.3);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.15);
          color: #fff;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: background 0.2s;
        }
        .wm-close:hover { background: rgba(0,0,0,0.55); }

        /* ══ MOBILE ═══════════════════════════════════════ */
        @media (max-width: 600px) {
          .wm-card { flex-direction: column; max-height: 92vh; overflow-y: auto; }
          .wm-left { flex: none; width: 100%; padding: 2rem 1.5rem; min-height: unset; }
          .wm-right { display: none; }
          .wm-heading { font-size: 2rem; }
        }
      `}</style>

      <div className="wm-overlay" onClick={close}>
        <div className="wm-card" onClick={e => e.stopPropagation()}>

          {/* ── Left white glass panel ─────────────────── */}
          <div className="wm-left">

            <div className="wm-logo">
              <img src="/desayner-logo.png" alt="Desayner" />
            </div>

            <div className="wm-body">
              <p className="wm-eyebrow">The designer&apos;s platform</p>
              <h2 className="wm-heading">
                Where great<br />
                design <em>lives.</em>
              </h2>
              <p className="wm-desc">
                Desayner gives you everything you need to grow as a designer.
                Build your portfolio, explore free stock photos, generate color palettes,
                and connect with a community that understands your craft.
              </p>
              <div className="wm-pills">
                <span className="wm-pill">Free Stock Photos</span>
                <span className="wm-pill">Color Palettes</span>
                <span className="wm-pill">Portfolio</span>
                <span className="wm-pill">Community</span>
                <span className="wm-pill">Moodboards</span>
              </div>
            </div>

            <div className="wm-footer">
              <button className="wm-btn-start" onClick={close}>
                Get Started
              </button>
            </div>

          </div>

          {/* ── Right image panel ───────────────── */}
          <div className="wm-right">
            <img src="/welcome-image.jpeg" alt="Designers at work" />
            <div className="wm-right-scrim" />
          </div>

          {/* ── Close ──────────────────────────── */}
          <button className="wm-close" onClick={close} aria-label="Close">
            <X size={14} strokeWidth={2.5} />
          </button>

        </div>
      </div>
    </>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  return null;
}
