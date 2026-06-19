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
      <style jsx>{`
        .profile-completeness {
          padding: 1rem 1.25rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          margin-bottom: 1.5rem;
        }
        .profile-completeness--compact {
          margin-bottom: 1rem;
        }
        .profile-completeness__top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }
        .profile-completeness__label {
          margin: 0;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #64748b;
        }
        .profile-completeness__percent {
          margin: 0.15rem 0 0;
          font-size: 1rem;
          font-weight: 800;
          color: #0f172a;
        }
        .profile-completeness__cta {
          font-size: 0.8rem;
          font-weight: 700;
          color: #2d43e8;
          text-decoration: none;
          white-space: nowrap;
        }
        .profile-completeness__bar {
          height: 6px;
          background: #e2e8f0;
          border-radius: 999px;
          overflow: hidden;
          margin: 1rem 0;
        }
        .profile-completeness__bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #2d43e8, #6366f1);
          border-radius: 999px;
          transition: width 0.4s ease;
        }
        .profile-completeness__steps {
          list-style: none;
          margin: 0.75rem 0 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .profile-completeness__steps a {
          font-size: 0.82rem;
          font-weight: 600;
          color: #334155;
          text-decoration: none;
        }
      `}</style>
    </div>
  );
}
