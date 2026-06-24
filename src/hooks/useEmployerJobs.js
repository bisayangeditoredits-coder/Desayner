import { useState, useEffect } from 'react';
import { getEmployerDashboard } from '@/lib/services/jobsService';

/**
 * Custom hook to fetch and manage the employer's dashboard state.
 * Handles fetching jobs and profile, and managing loading/error states.
 * @returns {Object} { jobs, profile, loading, error, selectedJobId, setSelectedJobId, setProfile }
 */
export function useEmployerJobs() {
  const [jobs, setJobs] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedJobId, setSelectedJobId] = useState(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true);
        const data = await getEmployerDashboard();
        setJobs(data.jobs || []);
        setProfile(data.profile || null);
        if (data.jobs && data.jobs.length > 0) {
          setSelectedJobId(data.jobs[0].id);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  return {
    jobs,
    profile,
    loading,
    error,
    selectedJobId,
    setSelectedJobId,
    setProfile
  };
}
