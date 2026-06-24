import { useState, useEffect } from 'react';
import { getJobApplications, updateApplicationStatus } from '@/lib/services/jobsService';

/**
 * Custom hook to fetch and manage applications for a specific job.
 * @param {string} jobId - The ID of the job to fetch applications for
 * @returns {Object} { applications, loading, error, changeStatus }
 */
export function useJobApplications(jobId) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!jobId) return;

    async function loadApps() {
      setLoading(true);
      setError(null);
      try {
        const apps = await getJobApplications(jobId);
        setApplications(apps);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadApps();
  }, [jobId]);

  /**
   * Optimistically updates the status of an application and syncs with the server.
   * @param {string} applicationId - The application to update
   * @param {string} newStatus - The new status
   */
  const changeStatus = async (applicationId, newStatus) => {
    try {
      await updateApplicationStatus(jobId, applicationId, newStatus);
      setApplications(apps => apps.map(app => 
        app.id === applicationId ? { ...app, status: newStatus } : app
      ));
    } catch (err) {
      alert(err.message);
    }
  };

  return {
    applications,
    loading,
    error,
    changeStatus
  };
}
