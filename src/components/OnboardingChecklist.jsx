'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getProfileCompleteness } from '@/lib/profileCompleteness';
import { Check, X, ArrowRight } from 'lucide-react';

const DISMISS_KEY = 'onboarding_checklist_dismissed';

function getInitialDismissed() {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(DISMISS_KEY) === 'true';
}

export default function OnboardingChecklist() {
  const [profile, setProfile] = useState(null);
  const [dismissed, setDismissed] = useState(getInitialDismissed);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('avatar_url, bio, cover_url, location, tools, projects_count')
        .eq('id', user.id)
        .single();

      if (data) setProfile(data);
    }
    load();

    const refresh = () => load();
    window.addEventListener('profile_updated', refresh);
    return () => window.removeEventListener('profile_updated', refresh);
  }, [supabase]);

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
      {/* Header row */}
      <div className="ocl__header">
        <div className="ocl__header-left">
          <span className="ocl__badge">{doneCount}/{totalCount}</span>
          <div>
            <p className="ocl__eyebrow">Getting started</p>
            <h3 className="ocl__title">Complete your profile</h3>
          </div>
        </div>
        <button type="button" className="ocl__close" onClick={dismiss} aria-label="Dismiss">
          <X size={14} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="ocl__bar-wrap">
        <div className="ocl__bar-fill" style={{ width: `${percent}%` }} />
      </div>
      <p className="ocl__percent">{percent}% complete</p>

      {/* Steps */}
      <ul className="ocl__list">
        {items.map((item) => (
          <li key={item.id} className={item.done ? 'ocl__item ocl__item--done' : 'ocl__item'}>
            <span className={item.done ? 'ocl__circle ocl__circle--done' : 'ocl__circle'}>
              {item.done ? <Check size={11} strokeWidth={3} /> : null}
            </span>
            <div className="ocl__item-body">
              {item.done ? (
                <span className="ocl__item-label">{item.label}</span>
              ) : (
                <Link href={item.href} className="ocl__item-link">
                  <span className="ocl__item-label">{item.label}</span>
                  <ArrowRight size={13} />
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>

      <style>{`
        .ocl {
          margin: 0 1.5rem 1rem;
          background: #ffffff;
          border: 1px solid #e8ecf0;
          border-radius: 16px;
          overflow: hidden;
        }

        /* ── Header ─────────────────────────────────── */
        .ocl__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.1rem 1.25rem 0.75rem;
          gap: 1rem;
        }
        .ocl__header-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .ocl__badge {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(45,67,232,0.08);
          border: 1px solid rgba(45,67,232,0.14);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.72rem;
          font-weight: 800;
          color: #2d43e8;
          flex-shrink: 0;
        }
        .ocl__eyebrow {
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #2d43e8;
          margin: 0 0 0.1rem;
        }
        .ocl__title {
          margin: 0;
          font-size: 0.9rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.01em;
        }
        .ocl__close {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          border: 1px solid #e8ecf0;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #94a3b8;
          flex-shrink: 0;
          transition: all 0.15s;
        }
        .ocl__close:hover {
          background: #f1f5f9;
          color: #475569;
        }

        /* ── Progress ────────────────────────────────── */
        .ocl__bar-wrap {
          height: 3px;
          background: #f1f5f9;
          margin: 0 1.25rem;
        }
        .ocl__bar-fill {
          height: 100%;
          background: #2d43e8;
          border-radius: 999px;
          transition: width 0.5s cubic-bezier(0.4,0,0.2,1);
        }
        .ocl__percent {
          font-size: 0.7rem;
          color: #94a3b8;
          font-weight: 600;
          margin: 0.4rem 1.25rem 0;
        }

        /* ── List ────────────────────────────────────── */
        .ocl__list {
          list-style: none;
          margin: 0.75rem 0 0;
          padding: 0;
        }
        .ocl__item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.6rem 1.25rem;
          border-top: 1px solid #f8fafc;
          transition: background 0.12s;
        }
        .ocl__item:hover {
          background: #fafbff;
        }
        .ocl__item--done {
          opacity: 0.5;
        }
        .ocl__item--done:hover {
          background: transparent;
        }

        /* Circle check */
        .ocl__circle {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 1.5px solid #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: white;
          transition: all 0.2s;
        }
        .ocl__circle--done {
          background: #2d43e8;
          border-color: #2d43e8;
          color: white;
        }

        /* Item content */
        .ocl__item-body {
          flex: 1;
          min-width: 0;
        }
        .ocl__item-label {
          font-size: 0.83rem;
          font-weight: 500;
          color: #1e293b;
        }
        .ocl__item--done .ocl__item-label {
          text-decoration: line-through;
          color: #94a3b8;
        }
        .ocl__item-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          text-decoration: none;
          width: 100%;
          color: inherit;
        }
        .ocl__item-link .ocl__item-label {
          font-weight: 600;
          color: #0f172a;
        }
        .ocl__item-link svg {
          color: #2d43e8;
          opacity: 0.6;
          flex-shrink: 0;
          transition: transform 0.15s;
        }
        .ocl__item-link:hover svg {
          opacity: 1;
          transform: translateX(2px);
        }

        @media (max-width: 640px) {
          .ocl {
            margin: 0 1rem 1rem;
          }
        }
      `}</style>
    </div>
  );
}
