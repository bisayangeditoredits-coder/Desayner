'use client';

import { useEffect, useState } from 'react';
import { Bookmark, BriefcaseBusiness, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import JobCard from '@/components/JobCard';
import JobDetailsModal from '@/components/JobDetailsModal';

export default function SavedJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [savedJobIds, setSavedJobIds] = useState(new Set());

  useEffect(() => {
    async function fetchSavedJobs() {
      try {
        const res = await fetch('/api/jobs/saved');
        if (!res.ok) throw new Error('Failed to load saved jobs');
        
        const data = await res.json();
        const savedJobs = (data.saved_jobs || []).map(s => s.job_data);
        
        setJobs(savedJobs);
        setSavedJobIds(new Set(savedJobs.map(j => j.id)));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchSavedJobs();
  }, []);

  const handleToggleSave = async (job) => {
    const isSaved = savedJobIds.has(job.id);
    
    // Optimistic remove
    setSavedJobIds((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(job.id);
      else next.add(job.id);
      return next;
    });

    setJobs((prev) => isSaved ? prev.filter(j => j.id !== job.id) : [...prev, job]);

    try {
      if (isSaved) {
        await fetch(`/api/jobs/saved?jobId=${job.id}`, { method: 'DELETE' });
      } else {
        await fetch('/api/jobs/saved', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ job })
        });
      }
    } catch (err) {
      console.error('Failed to toggle save job', err);
      // Revert
      setSavedJobIds((prev) => {
        const next = new Set(prev);
        if (isSaved) next.add(job.id);
        else next.delete(job.id);
        return next;
      });
      setJobs((prev) => isSaved ? [...prev, job] : prev.filter(j => j.id !== job.id));
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 1.5rem', minHeight: '80vh' }}>
      <div style={{ marginBottom: '3rem' }}>
        <Link href="/job-board" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none', marginBottom: '1.5rem' }}>
          <ArrowLeft size={16} /> Back to Job Board
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', background: '#0f172a', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bookmark size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-jakarta)', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Saved Jobs</h1>
            <p style={{ color: '#64748b', margin: '0.2rem 0 0', fontWeight: 500 }}>Your bookmarked remote opportunities</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(285px, 1fr))', gap: '1rem' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="shimmer-box" style={{ height: '320px', borderRadius: '16px' }} />
          ))}
        </div>
      ) : error ? (
        <div style={{ padding: '2rem', background: '#fee2e2', color: '#991b1b', borderRadius: '12px' }}>
          {error}
        </div>
      ) : jobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '6rem 2rem', background: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
          <div style={{ width: '64px', height: '64px', background: '#f8fafc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <BriefcaseBusiness size={28} color="#94a3b8" />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>No saved jobs yet</h2>
          <p style={{ color: '#64748b', maxWidth: '300px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
            When you find a role you like on the Job Board, click the bookmark icon to save it here for later.
          </p>
          <Link href="/job-board" className="btn btn-dark" style={{ padding: '0.8rem 2rem', borderRadius: '99px', textDecoration: 'none', fontWeight: 700 }}>
            Browse Jobs
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(285px, 1fr))', gap: '1rem' }}>
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} onSelectJob={setSelectedJob} />
          ))}
        </div>
      )}

      {selectedJob && (
        <JobDetailsModal 
          job={selectedJob} 
          onClose={() => setSelectedJob(null)}
          isSaved={savedJobIds.has(selectedJob.id)}
          onToggleSave={handleToggleSave}
        />
      )}
    </div>
  );
}
