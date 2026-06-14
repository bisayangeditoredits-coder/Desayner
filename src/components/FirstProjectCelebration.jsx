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
    </div>
  );
}
