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
    </div>
  );
}
