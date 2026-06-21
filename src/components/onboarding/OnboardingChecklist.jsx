'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import useProfileStore from '@/store/useProfileStore';
import { getProfileCompleteness } from '@/lib/profileCompleteness';

const DISMISS_KEY = 'onboarding_checklist_dismissed';

function getInitialDismissed() {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(DISMISS_KEY) === 'true';
}

export default function OnboardingChecklist() {
  const profile = useProfileStore((s) => s.profile);
  const [dismissed, setDismissed] = useState(getInitialDismissed);

  useEffect(() => {
    const refresh = () => useProfileStore.getState().invalidate();
    window.addEventListener('profile_updated', refresh);
    return () => window.removeEventListener('profile_updated', refresh);
  }, []);

  if (!profile || dismissed) return null;

  const { percent, items, isComplete } = getProfileCompleteness(profile);
  if (isComplete) return null;

  const doneCount = items.filter(i => i.done).length;
  const totalCount = items.length;

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, 'true');
    setDismissed(true);
  }

  return (
    <div className="ocl">
      <div className="ocl__header">
        <div>
          <h3 className="ocl__title">Complete your profile</h3>
          <p className="ocl__subtitle">{doneCount} of {totalCount} steps completed</p>
        </div>
        <button type="button" className="ocl__close" onClick={dismiss} aria-label="Dismiss">
          Dismiss
        </button>
      </div>

      <ul className="ocl__list">
        {items.map((item) => (
          <li key={item.id} className={item.done ? 'ocl__item ocl__item--done' : 'ocl__item'}>
            {item.done ? (
              <span className="ocl__item-label">{item.label}</span>
            ) : (
              <Link href={item.href} className="ocl__item-link">
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ul>

      <style>{`
        .ocl {
          margin: 0 1.5rem 1.5rem;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1.5rem;
        }

        .ocl__header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 1.25rem;
        }

        .ocl__title {
          margin: 0 0 0.25rem 0;
          font-size: 1rem;
          font-weight: 600;
          color: #0f172a;
          letter-spacing: -0.01em;
        }

        .ocl__subtitle {
          margin: 0;
          font-size: 0.85rem;
          color: #64748b;
        }

        .ocl__close {
          background: transparent;
          border: none;
          font-size: 0.8rem;
          font-weight: 500;
          color: #94a3b8;
          cursor: pointer;
          padding: 0;
          transition: color 0.15s;
        }

        .ocl__close:hover {
          color: #0f172a;
        }

        .ocl__list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .ocl__item {
          font-size: 0.9rem;
        }

        .ocl__item-label {
          color: #94a3b8;
          text-decoration: line-through;
        }

        .ocl__item-link {
          text-decoration: none;
          color: #0f172a;
          font-weight: 500;
          transition: color 0.15s;
        }

        .ocl__item-link:hover {
          color: #2d43e8;
          text-decoration: underline;
        }

        @media (max-width: 640px) {
          .ocl {
            margin: 0 1rem 1.5rem;
            padding: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
}
