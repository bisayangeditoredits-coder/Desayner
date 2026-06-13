'use client';

import { useEffect, useRef, useState } from 'react';
import { X, MapPin, BriefcaseBusiness, CalendarDays, ArrowUpRight, Bookmark, Building2, Check } from 'lucide-react';

function formatDate(value) {
  if (!value) return 'Recently posted';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently posted';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function formatJobType(value) {
  if (!value) return 'Remote role';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function JobDetailsModal({ job, onClose, isSaved = false, onToggleSave }) {
  const modalRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  const handleSaveClick = async () => {
    if (!onToggleSave) return;
    setSaving(true);
    await onToggleSave(job);
    setSaving(false);
  };

  if (!job) return null;

  const initials = job.company
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  return (
    <div 
      className="job-modal-backdrop"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        style={{
          background: 'white',
          width: '100%',
          maxWidth: '800px',
          maxHeight: '90vh',
          borderRadius: '16px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header */}
        <div style={{ padding: '2rem', borderBottom: '1px solid #f1f5f9', position: 'relative' }}>
          <button 
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1.5rem',
              right: '1.5rem',
              background: '#f8fafc',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
            onMouseOut={(e) => e.currentTarget.style.background = '#f8fafc'}
          >
            <X size={18} />
          </button>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', paddingRight: '3rem' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                border: '1px solid rgba(0,0,0,0.04)',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                overflow: 'hidden',
                color: '#475569',
                fontWeight: 800,
                fontSize: '1.2rem',
                padding: '8px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
              }}
            >
              {(!job.logo || logoFailed) ? (
                <div style={{
                  width: '100%', height: '100%', borderRadius: '10px',
                  background: `linear-gradient(135deg, hsl(${(job.company.charCodeAt(0) * 15) % 360}, 80%, 65%), hsl(${(job.company.charCodeAt(1) * 25) % 360}, 80%, 45%))`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 900, fontSize: '1.6rem', textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                }}>
                  {job.company.charAt(0).toUpperCase()}
                </div>
              ) : (
                <img
                  src={job.logo}
                  alt={job.company}
                  onError={() => setLogoFailed(true)}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              )}
            </div>

            <div>
              <div style={{ color: '#2d43e8', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
                {job.category}
              </div>
              <h1 style={{ color: '#0f172a', fontSize: '1.75rem', lineHeight: 1.15, fontWeight: 900, margin: 0, fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
                {job.title}
              </h1>
              <p style={{ color: '#475569', fontSize: '1.15rem', margin: 0, fontWeight: 600 }}>
                {job.company}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginTop: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.85rem', fontWeight: 700 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: '#f1f5f9' }}>
                <MapPin size={13} color="#64748b" />
              </div>
              <span>{job.location}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.85rem', fontWeight: 700 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: '#f1f5f9' }}>
                <BriefcaseBusiness size={13} color="#64748b" />
              </div>
              <span>{formatJobType(job.jobType)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.85rem', fontWeight: 700 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: '#f1f5f9' }}>
                <CalendarDays size={13} color="#64748b" />
              </div>
              <span>Posted {formatDate(job.publishedAt)}</span>
            </div>
          </div>

          {job.salary && (
            <div style={{ marginTop: '1.25rem' }}>
              <span style={{
                display: 'inline-flex',
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                background: '#f0fdf4',
                color: '#166534',
                fontWeight: 800,
                fontSize: '0.85rem',
                border: '1px solid #dcfce7',
              }}>
                {job.salary}
              </span>
            </div>
          )}
        </div>

        {/* Content (Scrollable) */}
        <div style={{ padding: '2rem', overflowY: 'auto', flex: 1, backgroundColor: '#fafafa' }}>
          <style dangerouslySetInnerHTML={{__html: `
            .job-description-prose h1, .job-description-prose h2, .job-description-prose h3 {
              color: #0f172a;
              margin-top: 2rem;
              margin-bottom: 1rem;
              font-weight: 800;
              font-family: var(--font-jakarta);
            }
            .job-description-prose p {
              color: #334155;
              line-height: 1.7;
              margin-bottom: 1.25rem;
            }
            .job-description-prose ul, .job-description-prose ol {
              color: #334155;
              line-height: 1.7;
              margin-bottom: 1.25rem;
              padding-left: 1.5rem;
            }
            .job-description-prose li {
              margin-bottom: 0.5rem;
            }
            .job-description-prose a {
              color: #2d43e8;
              text-decoration: underline;
            }
            .job-description-prose strong {
              color: #0f172a;
              font-weight: 700;
            }
          `}} />
          <div 
            className="job-description-prose"
            dangerouslySetInnerHTML={{ __html: job.description || '<p>No detailed description available.</p>' }} 
          />
          
          {job.tags?.length > 0 && (
            <div style={{ marginTop: '3rem', borderTop: '1px solid rgba(0,0,0,0.04)', paddingTop: '2rem' }}>
              <h3 style={{ color: '#0f172a', fontSize: '1.1rem', fontWeight: 900, marginBottom: '1.25rem', fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.01em' }}>Required Skills</h3>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                {job.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      background: 'rgba(0,0,0,0.03)',
                      color: '#334155',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div style={{ padding: '1.5rem 2rem', background: 'white', borderTop: '1px solid rgba(0,0,0,0.04)', display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={handleSaveClick}
            disabled={saving}
            className="btn btn-outline"
            style={{
              padding: '0.85rem 1.75rem',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.95rem',
              fontWeight: 800,
              color: isSaved ? '#0f172a' : '#475569',
              borderColor: isSaved ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.08)',
              background: isSaved ? '#f8fafc' : 'white',
              opacity: saving ? 0.7 : 1,
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
            }}
          >
            {isSaved ? (
              <><Check size={18} /> Saved</>
            ) : (
              <><Bookmark size={18} /> Save for later</>
            )}
          </button>

          <a
            href={job.url}
            target="_blank"
            rel="noreferrer"
            className="btn btn-dark"
            style={{ 
              padding: '0.85rem 2.5rem', 
              borderRadius: '12px', 
              fontSize: '0.95rem', 
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#231f20',
              color: 'white',
              textDecoration: 'none',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
            }}
          >
            Apply Now <ArrowUpRight size={16} />
          </a>
        </div>
      </div>
    </div>
  );
}
