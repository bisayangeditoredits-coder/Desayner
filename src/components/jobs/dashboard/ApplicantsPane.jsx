'use client';

import React from 'react';
import { Loader2, FileText, CheckCircle2, XCircle, Clock, ExternalLink, Users } from 'lucide-react';
import { useJobApplications } from '@/hooks/useJobApplications';

/**
 * ApplicantsPane Component
 * Renders the list of applications for a specific job. State is managed by useJobApplications.
 * @param {Object} props
 * @param {string} props.jobId - The selected job ID
 */
export default function ApplicantsPane({ jobId }) {
  const { applications, loading, error, changeStatus } = useJobApplications(jobId);

  const handleStatusUpdate = (applicationId, newStatus) => {
    changeStatus(applicationId, newStatus);
  };

  if (!jobId) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', color: '#94a3b8' }}>
        Select a job from the list to view its applicants.
      </div>
    );
  }

  if (loading) {
    return <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="spinner" size={32} color="#3b82f6" /></div>;
  }

  if (error) {
    return <div style={{ color: '#ef4444', padding: '2rem', textAlign: 'center' }}>{error}</div>;
  }

  return (
    <div style={{ background: '#ffffff', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '2rem', borderBottom: '1px solid #e2e8f0' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Applicants ({applications.length})</h2>
      </div>

      <div style={{ overflowY: 'auto', flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {applications.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '4rem' }}>
            <Users size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
            <p>No one has applied for this role yet.</p>
          </div>
        ) : (
          applications.map(app => (
            <div key={app.id} style={{ 
              border: '1px solid #f1f5f9', 
              borderRadius: '16px', 
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              background: '#ffffff',
              boxShadow: '0 4px 20px -5px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>{app.designer_name}</h3>
                  <a href={`mailto:${app.designer_email}`} style={{ color: '#64748b', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 500 }}>{app.designer_email}</a>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleStatusUpdate(app.id, 'shortlisted')} style={{
                    background: app.status === 'shortlisted' ? '#0f172a' : 'transparent',
                    color: app.status === 'shortlisted' ? '#ffffff' : '#64748b',
                    border: '1px solid',
                    borderColor: app.status === 'shortlisted' ? '#0f172a' : '#e2e8f0',
                    padding: '0.4rem 1rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.35rem', transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => { if(app.status !== 'shortlisted') { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#0f172a'; } }}
                  onMouseOut={(e) => { if(app.status !== 'shortlisted') { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; } }}
                  >
                    <CheckCircle2 size={14} /> Shortlist
                  </button>
                  <button onClick={() => handleStatusUpdate(app.id, 'rejected')} style={{
                    background: app.status === 'rejected' ? '#fee2e2' : 'transparent',
                    color: app.status === 'rejected' ? '#991b1b' : '#64748b',
                    border: '1px solid',
                    borderColor: app.status === 'rejected' ? '#fca5a5' : '#e2e8f0',
                    padding: '0.4rem 1rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.35rem', transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => { if(app.status !== 'rejected') { e.currentTarget.style.borderColor = '#fca5a5'; e.currentTarget.style.color = '#ef4444'; } }}
                  onMouseOut={(e) => { if(app.status !== 'rejected') { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; } }}
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              </div>

              {app.portfolio_url && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>Portfolio:</span>
                  <a href={app.portfolio_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0f172a', fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                    {app.portfolio_url.replace(/^https?:\/\//, '')} <ExternalLink size={12} color="#94a3b8" />
                  </a>
                </div>
              )}

              {app.cover_letter && (
                <div style={{ padding: '0 0 0 1rem', borderLeft: '3px solid #e2e8f0', marginTop: '0.25rem' }}>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{app.cover_letter}</p>
                </div>
              )}

              <div style={{ marginTop: '0.75rem' }}>
                <a 
                  href={app.resume_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    background: '#0f172a', color: 'white', padding: '0.6rem 1.25rem',
                    borderRadius: '99px', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none',
                    boxShadow: '0 4px 12px -4px rgba(15,23,42,0.3)', transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#1e293b'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#0f172a'}
                >
                  <FileText size={16} /> View Resume
                </a>
              </div>
            </div>
          ))
        )}
      </div>
      <style jsx>{`
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
