'use client';

import { useState } from 'react';
import { ArrowUpRight, BriefcaseBusiness, Building2, CalendarDays, MapPin } from 'lucide-react';

function formatDate(value) {
  if (!value) return 'Recently posted';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently posted';

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function formatJobType(value) {
  if (!value) return 'Remote role';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function JobCard({ job, onSelectJob }) {
  const [logoFailed, setLogoFailed] = useState(false);
  const initials = job.company
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  return (
    <article
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'white',
        border: '1px solid rgba(0,0,0,0.05)',
        borderRadius: '24px',
        minHeight: '340px',
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.02)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        cursor: 'pointer',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.06)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.02)';
      }}
      onClick={(e) => {
        if (!e.target.closest('a') && !e.target.closest('button')) {
          if (onSelectJob) onSelectJob(job);
        }
      }}
    >
      <div style={{ padding: '1.25rem 1.25rem 1rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', borderBottom: '1px solid #f8fafc' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            border: '1px solid rgba(0,0,0,0.04)',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            overflow: 'hidden',
            color: '#475569',
            fontWeight: 800,
            fontSize: '0.9rem',
            padding: '6px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          }}
        >
          {job.logo && !logoFailed ? (
            <img
              src={job.logo}
              alt={job.company}
              loading="lazy"
              decoding="async"
              onError={() => setLogoFailed(true)}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          ) : (
            initials || <Building2 size={20} />
          )}
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ color: '#0009fa', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.35rem', letterSpacing: '0.04em' }}>
            {job.category}
          </div>
          <h2
            style={{
              color: '#0f172a',
              fontSize: '1.15rem',
              lineHeight: 1.25,
              fontWeight: 900,
              margin: 0,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              fontFamily: 'var(--font-jakarta)',
              letterSpacing: '-0.02em',
            }}
          >
            {job.title}
          </h2>
          <p className="truncate" style={{ color: '#475569', fontSize: '0.85rem', marginTop: '0.4rem', fontWeight: 600 }}>
            {job.company}
          </p>
        </div>
      </div>

      <div style={{ padding: '1rem 1.25rem', flex: 1 }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 700 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', background: '#f1f5f9' }}>
              <MapPin size={11} color="#64748b" />
            </div>
            <span className="truncate" style={{ maxWidth: '120px' }}>{job.location}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 700 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', background: '#f1f5f9' }}>
              <BriefcaseBusiness size={11} color="#64748b" />
            </div>
            <span>{formatJobType(job.jobType)}</span>
          </div>
        </div>

        {job.salary && (
          <div
            style={{
              display: 'inline-flex',
              maxWidth: '100%',
              padding: '0.35rem 0.6rem',
              borderRadius: '6px',
              background: '#f0fdf4',
              color: '#166534',
              fontWeight: 800,
              fontSize: '0.75rem',
              marginBottom: '1rem',
              border: '1px solid #dcfce7',
            }}
          >
            <span className="truncate">{job.salary}</span>
          </div>
        )}

        <p
          style={{
            color: '#475569',
            fontSize: '0.85rem',
            lineHeight: 1.6,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            margin: 0,
          }}
        >
          {job.description || 'Open remote role listed on Remotive.'}
        </p>

        {job.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            {job.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  background: 'rgba(0,0,0,0.03)',
                  color: '#334155',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '1.25rem', background: '#fafafa', borderTop: '1px solid rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', background: 'white', border: '1px solid #f1f5f9' }}>
            <CalendarDays size={10} color="#94a3b8" />
          </div>
          <span>{formatDate(job.publishedAt)}</span>
        </div>
        <a
          href={job.url}
          target="_blank"
          rel="noreferrer"
          className="btn btn-dark"
          style={{ 
            padding: '0.65rem 1.25rem', 
            borderRadius: '12px', 
            fontSize: '0.8rem', 
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: '#0a0a0a',
            color: 'white',
            textDecoration: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          Apply Now <ArrowUpRight size={14} />
        </a>
      </div>
    </article>
  );
}
