'use client';
import { Loader2, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useJobs } from '@/hooks/useJobs';
import JobDetailsPane from '@/components/jobs/JobDetailsPane';
import JobsList from '@/components/jobs/JobsList';

export default function JobsClientWrapper({ initialJobs }) {
  const { 
    jobs, 
    loading, 
    isLoadingMore, 
    selectedJob, 
    setSelectedJob, 
    searchQuery, 
    setSearchQuery, 
    lastElementRef 
  } = useJobs(initialJobs);

  return (
    <div className="jobs-layout-container">
      {/* Left Column */}
      <div className="jobs-sidebar-column">
        {/* Header Area */}
        <div className="jobs-sidebar-header">
          <h1 className="jobs-sidebar-title">Job Board</h1>
          <p className="jobs-sidebar-subtitle">
            Find premium roles. Curated for top-tier creatives.
          </p>
          
          <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Search roles or companies..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.5rem',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                outline: 'none',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div className="jobs-sidebar-actions">
            <Link href="/jobs/dashboard" className="jobs-action-btn-secondary">
              Manage My Jobs
            </Link>
            
            <Link href="/jobs/post" className="jobs-action-btn-primary">
              <Plus size={16} strokeWidth={2.5} /> Post a Job
            </Link>
          </div>
        </div>

        {/* List Area */}
        <div className="jobs-list-area">
          {loading && !jobs.length ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
              <Loader2 size={32} className="spinner" color="#3b82f6" />
            </div>
          ) : (
            <>
              <JobsList 
                jobs={jobs} 
                selectedJob={selectedJob} 
                setSelectedJob={setSelectedJob} 
                lastElementRef={lastElementRef}
              />
              {isLoadingMore && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                  <Loader2 size={24} className="spinner" color="#94a3b8" />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right Column: Details Pane */}
      <div className="jobs-details-column">
        {selectedJob ? (
          <JobDetailsPane job={selectedJob} />
        ) : (
          <div className="jobs-empty-selection">
            Select a job from the list to view its details.
          </div>
        )}
      </div>

      <style jsx>{`
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
