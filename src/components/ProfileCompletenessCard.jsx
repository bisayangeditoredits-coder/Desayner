'use client';

import Link from 'next/link';
import { getProfileCompleteness } from '@/lib/profileCompleteness';

export default function ProfileCompletenessCard({ profile, compact = false }) {
  if (!profile) return null;

  const { percent, incomplete, isComplete } = getProfileCompleteness(profile);
  if (isComplete) return null;

  const next = incomplete[0];

  return (
    <div className={`profile-completeness${compact ? ' profile-completeness--compact' : ''}`}>
      <div className="profile-completeness__top">
        <div>
          <p className="profile-completeness__label">Profile strength</p>
          <p className="profile-completeness__percent">{percent}% complete</p>
        </div>
        {!compact && next && (
          <Link href={next.href} className="profile-completeness__cta">
            {next.label} →
          </Link>
        )}
      </div>
      <div className="profile-completeness__bar">
        <div className="profile-completeness__bar-fill" style={{ width: `${percent}%` }} />
      </div>
      {!compact && (
        <ul className="profile-completeness__steps">
          {incomplete.slice(0, 3).map((item) => (
            <li key={item.id}>
              <Link href={item.href}>{item.label}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
