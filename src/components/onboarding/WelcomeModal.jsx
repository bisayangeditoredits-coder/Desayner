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
          max-width: 840px;
          min-height: 490px;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 48px 96px -24px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06);
          animation: wm-up 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }

        /* ══ LEFT BLUE PANEL ══════════════════════════════ */
        .wm-left {
          flex: 0 0 50%;
          width: 50%;
          background: #1e35e6;
          background-image:
            radial-gradient(ellipse 60% 80% at 10% 110%, rgba(255,255,255,0.07) 0%, transparent 70%),
            radial-gradient(ellipse 50% 50% at 90% -10%, rgba(110,130,255,0.35) 0%, transparent 60%);
          padding: 2.75rem 2.5rem;
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
          width: 150px;
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
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.45);
          margin: 0 0 0.9rem 0;
        }

        .wm-heading {
          font-size: 2.6rem;
          font-weight: 900;
          color: #fff;
          line-height: 1.05;
          letter-spacing: -0.03em;
          margin: 0 0 1.1rem 0;
        }

        .wm-heading em {
          font-style: normal;
          color: rgba(255,255,255,0.55);
        }

        .wm-desc {
          font-size: 0.875rem;
          color: rgba(255,255,255,0.72);
          line-height: 1.7;
          margin: 0 0 2rem 0;
          font-weight: 400;
        }

        .wm-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 2rem;
        }

        .wm-pill {
          padding: 0.35rem 0.85rem;
          border-radius: 100px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.82);
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.01em;
        }

        .wm-footer {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .wm-btn-start {
          flex: 1;
          padding: 0.9rem 1rem;
          background: #e6e82d;
          color: #09090b;
          border: none;
          border-radius: 12px;
          font-weight: 800;
          font-size: 0.9375rem;
          font-family: inherit;
          cursor: pointer;
          letter-spacing: -0.01em;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 8px 24px rgba(0,0,0,0.18);
        }
        .wm-btn-start:hover {
          background: #d4d628;
          transform: translateY(-1px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.22);
        }

        .wm-btn-skip {
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.45);
          font-size: 0.8rem;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          padding: 0.5rem;
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
          border: 1px solid rgba(255,255,255,0.18);
          border-radius: 10px;
          color: #fff;
          font-size: 0.75rem;
          font-weight: 600;
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
          border-radius: 50%;
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

          {/* ── Left blue panel ─────────────────── */}
          <div className="wm-left">

            <div className="wm-logo">
              <img src="/desayner-logo-white.png" alt="Desayner" />
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
