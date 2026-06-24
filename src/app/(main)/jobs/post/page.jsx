'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Briefcase } from 'lucide-react';
import JobPostForm from '@/components/jobs/forms/JobPostForm';
import { useEmployerVerification } from '@/hooks/useEmployerVerification';

/**
 * Job Posting Page
 * Validates the employer's verification status before allowing them to post a job.
 * Delegates the form UI and submission logic to JobPostForm.
 */
export default function PostJobPage() {
  const { profile, checkingAuth } = useEmployerVerification();
  const [success, setSuccess] = useState(false);

  // 1. Loading State
  if (checkingAuth) {
    return <div style={{ padding: '4rem', textAlign: 'center' }}><Loader2 className="spinner" size={32} color="#3b82f6" /></div>;
  }

  // 2. Success State (Job Submitted)
  if (success) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '2rem' }}>
        <div style={{ maxWidth: '500px', width: '100%', padding: '4rem 3rem', textAlign: 'center', background: '#ffffff', borderRadius: '0', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <div style={{ width: '80px', height: '80px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Briefcase size={40} color="#16a34a" />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem', letterSpacing: '-0.02em' }}>Job Submitted</h2>
          <p style={{ color: '#64748b', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '2.5rem' }}>
            Your job posting has been saved. It is currently <strong>Pending</strong> and will appear on the Job Board once approved by an admin. You can manage your postings from your Employer Dashboard.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link href="/jobs" style={{ display: 'inline-block', background: '#f1f5f9', color: '#0f172a', padding: '0.8rem 1.5rem', borderRadius: '0', fontWeight: 600, textDecoration: 'none', transition: 'background 0.2s' }}>
              Job Board
            </Link>
            <Link href="/jobs/dashboard" style={{ display: 'inline-block', background: '#2563eb', color: 'white', padding: '0.8rem 1.5rem', borderRadius: '0', fontWeight: 600, textDecoration: 'none', transition: 'background 0.2s' }}>
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Unauthorized / Unverified State
  if (!profile || profile.verification_status !== 'approved') {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '2rem' }}>
        <div style={{ maxWidth: '500px', width: '100%', padding: '4rem 3rem', textAlign: 'center', background: '#ffffff', borderRadius: '0', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <div style={{ width: '80px', height: '80px', background: '#fef3c7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Briefcase size={40} color="#d97706" />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem', letterSpacing: '-0.02em' }}>Verification Required</h2>
          <p style={{ color: '#64748b', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '2.5rem' }}>
            To post a job, your business account must be fully verified and approved by our admins to protect our community.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link href="/jobs/dashboard" style={{ display: 'inline-block', background: '#2563eb', color: 'white', padding: '0.8rem 1.5rem', borderRadius: '0', fontWeight: 600, textDecoration: 'none', transition: 'background 0.2s' }}>
              Verify Account Now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Main Posting Form State
  return (
    <div style={{ flex: 1, background: '#f8fafc', padding: '4rem 2rem', fontFamily: '"Inter", "Helvetica Neue", sans-serif', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      <div style={{ maxWidth: '800px', width: '100%' }}>
        <Link href="/jobs" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', textDecoration: 'none', fontWeight: 600, marginBottom: '2rem', fontSize: '0.9rem', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#0f172a'} onMouseOut={(e) => e.currentTarget.style.color = '#64748b'}>
          <ArrowLeft size={16} strokeWidth={2.5} /> Back to Job Board
        </Link>

        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 0.5rem 0', color: '#0f172a' }}>
            Post a Role
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#64748b', margin: 0, fontWeight: 500 }}>
            Find the perfect creative for your team.
          </p>
        </div>

        <JobPostForm onSuccess={() => setSuccess(true)} />
      </div>

      <style jsx>{`
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
