'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Copy, PartyPopper, Share2, X } from 'lucide-react';

export default function FirstProjectCelebration({ username }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (searchParams.get('firstProject') === '1' && username) {
      setOpen(true);
    }
  }, [searchParams, username]);

  if (!open || !username) return null;

  const profileUrl = `${window.location.origin}/profile/${username}`;

  function close() {
    setOpen(false);
    router.replace(`/profile/${username}`, { scroll: false });
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="celebration-overlay" role="dialog" aria-modal="true">
      <div className="celebration-modal">
        <button type="button" className="celebration-modal__close" onClick={close} aria-label="Close">
          <X size={18} />
        </button>
        <div className="celebration-modal__icon">
          <PartyPopper size={32} />
        </div>
        <h2>You&apos;re live!</h2>
        <p>Your first project is published. Share your profile and start getting discovered.</p>
        <div className="celebration-modal__actions">
          <button type="button" className="btn btn-dark" onClick={copyLink}>
            <Copy size={14} />
            {copied ? 'Copied!' : 'Copy profile link'}
          </button>
          <Link href={`/profile/${username}`} className="btn btn-outline" onClick={close}>
            <Share2 size={14} />
            View profile
          </Link>
        </div>
      </div>
      <style jsx>{`
        .celebration-overlay {
          position: fixed;
          inset: 0;
          z-index: 10000;
          background: rgba(0,0,0,0.65);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }
        .celebration-modal {
          position: relative;
          width: 100%;
          max-width: 420px;
          background: white;
          border-radius: 20px;
          padding: 2rem;
          text-align: center;
        }
        .celebration-modal__close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          border: none;
          background: #f1f5f9;
          border-radius: 8px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .celebration-modal__icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 1rem;
          border-radius: 50%;
          background: #eef0ff;
          color: #2d43e8;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .celebration-modal h2 {
          margin: 0 0 0.5rem;
          font-size: 1.5rem;
          font-weight: 900;
        }
        .celebration-modal p {
          margin: 0 0 1.5rem;
          color: #64748b;
          line-height: 1.5;
        }
        .celebration-modal__actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .celebration-modal__actions .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          border-radius: 12px;
        }
      `}</style>
    </div>
  );
}
