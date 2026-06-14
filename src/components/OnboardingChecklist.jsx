'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getProfileCompleteness } from '@/lib/profileCompleteness';
import { Check, ChevronRight, X } from 'lucide-react';

const DISMISS_KEY = 'onboarding_checklist_dismissed';

export default function OnboardingChecklist() {
  const [profile, setProfile] = useState(null);
  const [dismissed, setDismissed] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === 'true');
  }, []);

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

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, 'true');
    setDismissed(true);
  }

  return (
    <div className="onboarding-checklist">
      <div className="onboarding-checklist__header">
        <div>
          <p className="onboarding-checklist__eyebrow">Get started</p>
          <h3 className="onboarding-checklist__title">Complete your profile</h3>
          <p className="onboarding-checklist__subtitle">
            {percent}% done — finish these steps to stand out on Desayner.
          </p>
        </div>
        <button type="button" className="onboarding-checklist__close" onClick={dismiss} aria-label="Dismiss">
          <X size={16} />
        </button>
      </div>

      <div className="onboarding-checklist__bar">
        <div className="onboarding-checklist__bar-fill" style={{ width: `${percent}%` }} />
      </div>

      <ul className="onboarding-checklist__list">
        {items.map((item) => (
          <li key={item.id} className={item.done ? 'done' : ''}>
            <span className="onboarding-checklist__check">
              {item.done ? <Check size={12} strokeWidth={3} /> : null}
            </span>
            {item.done ? (
              <span>{item.label}</span>
            ) : (
              <Link href={item.href}>
                {item.label}
                <ChevronRight size={14} />
              </Link>
            )}
          </li>
        ))}
      </ul>
      <style jsx>{`
        .onboarding-checklist {
          margin: 0 1.5rem 1rem;
          padding: 1.25rem 1.5rem;
          background: linear-gradient(135deg, #eef0ff 0%, #f8fafc 100%);
          border: 1px solid #dbeafe;
          border-radius: 16px;
        }
        .onboarding-checklist__header {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          align-items: flex-start;
        }
        .onboarding-checklist__eyebrow {
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #2d43e8;
          margin: 0 0 0.25rem;
        }
        .onboarding-checklist__title {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 800;
          color: #0f172a;
        }
        .onboarding-checklist__subtitle {
          margin: 0.35rem 0 0;
          font-size: 0.82rem;
          color: #64748b;
        }
        .onboarding-checklist__close {
          border: none;
          background: white;
          border-radius: 8px;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #64748b;
        }
        .onboarding-checklist__bar {
          height: 6px;
          background: rgba(255,255,255,0.8);
          border-radius: 999px;
          overflow: hidden;
          margin: 1rem 0;
        }
        .onboarding-checklist__bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #2d43e8, #6366f1);
          border-radius: 999px;
          transition: width 0.4s ease;
        }
        .onboarding-checklist__list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 0.5rem;
        }
        .onboarding-checklist__list li {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          font-size: 0.85rem;
        }
        .onboarding-checklist__list li.done {
          color: #64748b;
          text-decoration: line-through;
        }
        .onboarding-checklist__list a {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          color: #0f172a;
          font-weight: 600;
          text-decoration: none;
        }
        .onboarding-checklist__check {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 2px solid #cbd5e1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: white;
        }
        .onboarding-checklist__list li.done .onboarding-checklist__check {
          background: #2d43e8;
          border-color: #2d43e8;
          color: white;
        }
        @media (max-width: 640px) {
          .onboarding-checklist {
            margin: 0 1rem 1rem;
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
