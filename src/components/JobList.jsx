'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, RefreshCw, Search, SlidersHorizontal, X } from 'lucide-react';
import JobCard from '@/components/JobCard';
import JobDetailsModal from '@/components/JobDetailsModal';
import JobAlertBanner from '@/components/JobAlertBanner';

const FALLBACK_CATEGORIES = ['All', 'Design', 'Development', 'Marketing', 'Product', 'Data', 'Customer Support', 'Sales'];
const CATEGORY_ORDER = [
  'All',
  'Design',
  'Development',
  'Marketing',
  'Product',
  'Data',
  'Customer Support',
  'Sales',
  'Business',
  'Finance',
  'Legal',
  'Writing',
  'Operations',
];

function sortCategories(items) {
  return [...items].sort((a, b) => {
    const aIndex = CATEGORY_ORDER.indexOf(a);
    const bIndex = CATEGORY_ORDER.indexOf(b);
    if (aIndex !== -1 || bIndex !== -1) {
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    }
    return a.localeCompare(b);
  });
}

export default function JobList() {
  const [jobs, setJobs] = useState([]);
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [source, setSource] = useState('Jobicy');
  const [sourceUrl, setSourceUrl] = useState('https://jobicy.com/jobs-rss-feed');
  const [sourceLinks, setSourceLinks] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [savedJobIds, setSavedJobIds] = useState(new Set());

  // Connect to API and use Optimistic UI updates
  const handleToggleSave = async (job) => {
    const isSaved = savedJobIds.has(job.id);
    
    setSavedJobIds((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(job.id);
      else next.add(job.id);
      return next;
    });

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
      setSavedJobIds((prev) => {
        const next = new Set(prev);
        if (isSaved) next.add(job.id);
        else next.delete(job.id);
        return next;
      });
    }
  };

  useEffect(() => {
    // Load user's saved jobs to populate bookmark icons correctly
    async function loadSavedJobs() {
      try {
        const res = await fetch('/api/jobs/saved');
        if (res.ok) {
          const data = await res.json();
          if (data.saved_jobs) {
            setSavedJobIds(new Set(data.saved_jobs.map(s => s.job_id)));
          }
        }
      } catch (err) {
        // user might not be logged in, just ignore
      }
    }
    loadSavedJobs();
  }, []);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/jobs', { cache: 'no-store' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to load jobs.');
      }

      setJobs(data.jobs || []);
      setCategories(['All', ...(data.categories || [])]);
      setSource(data.source || 'Multiple Verified Sources');
      setSourceUrl(data.sourceUrl || '#');
      setSourceLinks(data.sourceLinks || []);
    } catch (err) {
      setError(err.message || 'Unable to load jobs.');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadJobs, 0);
    return () => clearTimeout(timer);
  }, [loadJobs]);

  const filteredJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return jobs.filter((job) => {
      const categoryMatches = activeCategory === 'All' || job.category === activeCategory;
      if (!categoryMatches) return false;
      if (!normalizedQuery) return true;

      return [
        job.title,
        job.company,
        job.category,
        job.location,
        job.description,
        ...(job.tags || []),
      ].join(' ').toLowerCase().includes(normalizedQuery);
    });
  }, [activeCategory, jobs, query]);

  return (
    <section>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          alignItems: 'center',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="input"
            placeholder="Search roles, tools, companies..."
            style={{ paddingLeft: '2.45rem', height: '42px' }}
          />
        </div>
        <button
          type="button"
          onClick={loadJobs}
          className="btn btn-outline"
          style={{ height: '42px', borderRadius: '8px', padding: '0 1rem', justifyContent: 'center' }}
          disabled={loading}
        >
          <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem', minWidth: 0 }}>
        <SlidersHorizontal size={15} color="#64748b" style={{ flexShrink: 0 }} />
        <div className="hide-scrollbar" style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.1rem' }}>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '999px',
                border: '1px solid #e2e8f0',
                background: activeCategory === category ? '#0f172a' : 'white',
                color: activeCategory === category ? 'white' : '#334155',
                fontWeight: 800,
                fontSize: '0.75rem',
                whiteSpace: 'nowrap',
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', gap: '1rem' }}>
        <p style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>
          {loading ? 'Loading remote jobs...' : `${filteredJobs.length} remote ${filteredJobs.length === 1 ? 'job' : 'jobs'}`}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 700 }}>
            Powered by {source}
          </span>
          {sourceLinks.length > 0 && (
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <span style={{ color: '#cbd5e1' }}>•</span>
              {sourceLinks.map((link) => (
                <a key={link.name} href={link.url} target="_blank" rel="noreferrer" style={{ color: '#0f172a', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'underline' }}>
                  {link.name}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {error ? (
        <div style={{ background: 'white', border: '1px solid #fecaca', borderRadius: '8px', padding: '2rem', color: '#991b1b' }}>
          {error}
        </div>
      ) : loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(285px, 1fr))', gap: '1rem' }}>
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="shimmer-box" style={{ height: '320px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 2rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <div style={{ width: '58px', height: '58px', background: '#f8fafc', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <BriefcaseBusiness size={26} color="#94a3b8" />
          </div>
          <h2 style={{ color: '#0f172a', fontSize: '1.15rem', marginBottom: '0.35rem' }}>No matching roles</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Try a broader search or another category.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(285px, 1fr))', gap: '1rem' }}>
          {filteredJobs.map((job, index) => {
            const isAlertBannerPosition = index === 5;
            return (
              <div key={job.id} style={isAlertBannerPosition ? { gridColumn: '1 / -1' } : { display: 'contents' }}>
                <JobCard job={job} onSelectJob={setSelectedJob} />
                {isAlertBannerPosition && <JobAlertBanner />}
              </div>
            );
          })}
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
    </section>
  );
}
