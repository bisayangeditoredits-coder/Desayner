'use client';

import React from 'react';
import Link from 'next/link';
import { Briefcase, Users, ArrowLeft, Loader2, FileText, CheckCircle2, XCircle } from 'lucide-react';
import ApplicantsPane from '@/components/jobs/dashboard/ApplicantsPane';
import JobCard from '@/components/jobs/JobCard';
import EmployerVerification from '@/components/jobs/dashboard/EmployerVerification';
import { useEmployerJobs } from '@/hooks/useEmployerJobs';

/**
 * Employer Dashboard Page
 * Renders the dashboard layout and delegates state management to the useEmployerJobs hook.
 */
export default function EmployerDashboard() {
  const { jobs, profile, loading, error, selectedJobId, setSelectedJobId, setProfile } = useEmployerJobs();

  if (loading) {
    return <div style={{ padding: '4rem', textAlign: 'center' }}><Loader2 className="spinner" size={32} color="#3b82f6" /></div>;
  }

  if (error) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', height: '100%' }}>
        <div style={{ maxWidth: '450px', width: '100%', padding: '3rem 2rem', textAlign: 'center', background: '#ffffff', borderRadius: '24px', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <div style={{ width: '64px', height: '64px', background: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <XCircle size={32} color="#ef4444" />
          </div>
          <h2 style={{ color: '#0f172a', fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Oops! Something went wrong</h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            {error}
          </p>
          {error.toLowerCase().includes('log in') || error.toLowerCase().includes('unauthorized') ? (
            <Link href="/login" style={{ display: 'inline-block', background: '#2563eb', color: 'white', padding: '0.8rem 2rem', borderRadius: '99px', fontWeight: 600, textDecoration: 'none', transition: 'background 0.2s' }}>
              Go to Login
            </Link>
          ) : (
            <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Please make sure you have run the required database migrations.</p>
          )}
        </div>
      </div>
    );
  }

  if (!profile || profile.verification_status !== 'approved') {
    return (
      <div style={{ flex: 1, padding: '4rem 2rem', background: '#f8fafc', height: '100%', overflowY: 'auto' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <EmployerVerification profile={profile} onVerifySubmit={(newProfile) => setProfile(newProfile)} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flex: 1, 
      background: '#f8fafc',
      height: '100%', 
      overflow: 'hidden'
    }}>
      {/* Left Column: List of Jobs */}
      <div style={{ 
        width: '380px', 
        minWidth: '380px', 
        borderRight: '1px solid #e2e8f0', 
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}>
        <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
          <Link href="/jobs" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem' }}>
            <ArrowLeft size={16} /> Back to Job Board
          </Link>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Briefcase size={24} /> Employer Dashboard
          </h1>
          <p style={{ margin: '0.5rem 0 0 0', color: '#64748b', fontSize: '0.95rem' }}>Manage your postings and applicants.</p>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '1rem' }}>
          {jobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
              <p>You haven't posted any jobs yet.</p>
              <Link href="/jobs/post" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>Post a Job</Link>
            </div>
          ) : (
            jobs.map(job => (
              <JobCard 
                key={job.id}
                job={job}
                isActive={selectedJobId === job.id}
                onClick={() => setSelectedJobId(job.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Right Column: Applicants Pane */}
      <div style={{ flex: 1, height: '100%', overflowY: 'auto' }}>
        <ApplicantsPane jobId={selectedJobId} />
      </div>

      <style jsx>{`
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
