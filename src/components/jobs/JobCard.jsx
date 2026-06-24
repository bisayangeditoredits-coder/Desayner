import React from 'react';
import { MapPin, Building2 } from 'lucide-react';

export default function JobCard({ job, onClick, isActive }) {
  return (
    <div 
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '1.25rem',
        border: isActive ? '1px solid #0f172a' : '1px solid #e2e8f0',
        borderRadius: '16px',
        cursor: 'pointer',
        background: '#ffffff',
        transition: 'all 0.2s',
        marginBottom: '1rem',
        position: 'relative',
        boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
      }}
      className="job-card-compact"
    >
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        
        {/* Logo */}
        <div style={{ 
          width: '40px', 
          height: '40px', 
          borderRadius: '8px',
          backgroundColor: job.logo ? 'transparent' : '#f8fafc',
          backgroundImage: job.logo ? `url(${job.logo})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: job.logo ? '1px solid #e2e8f0' : '1px solid #e2e8f0',
          flexShrink: 0
        }}>
          {!job.logo && <Building2 size={20} color="#94a3b8" strokeWidth={1.5} />}
        </div>

        {/* Title & Company */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
            {job.title}
          </h3>
          <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>
            {job.company}
          </span>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            <MapPin size={12} strokeWidth={2.5} color="#94a3b8" />
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>{job.location}</span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
            {job.job_type && (
              <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '0.2rem 0.5rem', background: isActive ? '#dbeafe' : '#f1f5f9', color: isActive ? '#1d4ed8' : '#475569', borderRadius: '4px' }}>
                {job.job_type}
              </span>
            )}
            {job.level && (
              <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '0.2rem 0.5rem', background: isActive ? '#dcfce7' : '#f1f5f9', color: isActive ? '#166534' : '#475569', borderRadius: '4px' }}>
                {job.level}
              </span>
            )}
          </div>
          
          {/* Dashboard Specific Metadata (Only shown if job_applications count exists or status is provided) */}
          {job.job_applications !== undefined && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>
                <span style={{ background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '99px', color: '#0f172a' }}>
                  {job.job_applications[0]?.count || 0} Applicants
                </span>
              </div>
              {job.status && (
                <span style={{ 
                  fontSize: '0.65rem', 
                  fontWeight: 800, 
                  padding: '0.25rem 0.6rem', 
                  borderRadius: '99px',
                  background: job.status === 'active' ? '#dcfce7' : (job.status === 'pending' ? '#fef3c7' : '#fee2e2'),
                  color: job.status === 'active' ? '#166534' : (job.status === 'pending' ? '#92400e' : '#991b1b'),
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {job.status}
                </span>
              )}
            </div>
          )}
        </div>

      </div>

      <style jsx>{`
        .job-card-compact:hover {
          border-color: ${isActive ? '#0f172a' : '#cbd5e1'} !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
        }
      `}</style>
    </div>
  );
}
