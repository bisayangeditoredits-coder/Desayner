import React from 'react';
import JobCard from '@/components/jobs/JobCard';

export default function JobsList({ jobs, selectedJob, setSelectedJob, lastElementRef }) {
  if (jobs.length === 0) {
    return (
      <div style={{ padding: '4rem 0', textAlign: 'center', color: '#64748b', fontSize: '1rem', fontWeight: 500 }}>
        No open roles at the moment.
      </div>
    );
  }

  return (
    <div style={{ overflowY: 'auto', paddingRight: '0.5rem', height: '100%' }}>
      {jobs.map((job, index) => {
        const isLast = index === jobs.length - 1;
        return (
          <div key={job.id} ref={isLast ? lastElementRef : null}>
            <JobCard 
              job={job} 
              isActive={selectedJob?.id === job.id} 
              onClick={() => setSelectedJob(job)} 
            />
          </div>
        );
      })}
    </div>
  );
}
