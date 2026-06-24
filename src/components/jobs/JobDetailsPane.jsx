import React, { useState, useEffect } from 'react';
import { MapPin, Building2, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ApplyModal from './ApplyModal';

export default function JobDetailsPane({ job }) {
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    checkAuth();
  }, []);

  if (!job) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '1.1rem', fontWeight: 500, background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
        Select a job to see details
      </div>
    );
  }

  return (
    <div style={{ 
      background: '#ffffff', 
      padding: '2.5rem',
      height: '100%',
      overflowY: 'auto'
    }}>
      
      {/* Header section */}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div style={{ 
          width: '80px', 
          height: '80px', 
          borderRadius: '16px', 
          backgroundColor: job.logo ? 'transparent' : '#f8fafc',
          backgroundImage: job.logo ? `url(${job.logo})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #e2e8f0',
          flexShrink: 0
        }}>
          {!job.logo && <Building2 size={32} color="#94a3b8" strokeWidth={1.5} />}
        </div>
        
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0', lineHeight: 1.2 }}>
            {job.title}
          </h2>
          <div style={{ fontSize: '1.1rem', color: '#3b82f6', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {job.company}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
        <button 
          onClick={() => {
            if (!user) {
              router.push('/login?redirect=/jobs');
            } else {
              setShowApplyModal(true);
            }
          }}
          style={{
            background: '#2563eb',
            color: 'white',
            border: 'none',
            padding: '0.8rem 2rem',
            borderRadius: '99px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#1d4ed8'}
          onMouseOut={(e) => e.currentTarget.style.background = '#2563eb'}
        >
          {user ? 'Apply Now' : 'Log in to Apply'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '1rem', fontWeight: 500, marginLeft: '1rem' }}>
          <MapPin size={18} strokeWidth={2} /> {job.location}
        </div>
      </div>

      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '2.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '2rem', marginBottom: '2.5rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '12px' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Job Type</div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>{job.job_type || 'Full-Time'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Experience Level</div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>{job.level || 'Any'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Salary Range</div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
              {job.min_salary && job.max_salary 
                ? `${job.currency || 'USD'} ${job.min_salary.toLocaleString()} - ${job.max_salary.toLocaleString()} / mo` 
                : 'Undisclosed'}
            </div>
          </div>
        </div>

        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>Overview</h3>
        <p style={{ fontSize: '1.05rem', lineHeight: 1.7, color: '#475569', whiteSpace: 'pre-wrap' }}>
          {job.description || 'No detailed description provided by the company.'}
        </p>
      </div>

      {showApplyModal && (
        <ApplyModal job={job} user={user} onClose={() => setShowApplyModal(false)} />
      )}
    </div>
  );
}
