/**
 * Jobs Service
 * Contains all API calls related to fetching, creating, and updating job postings.
 */

/**
 * Fetches the employer's dashboard data (their posted jobs).
 * @returns {Promise<{ jobs: Array, profile: Object|null }>} The list of jobs and the employer profile
 */
export async function getEmployerDashboard() {
  const res = await fetch('/api/jobs/dashboard');
  if (res.status === 401) {
    throw new Error('Please log in to view your dashboard.');
  }
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to load dashboard data');
  }
  return res.json();
}

/**
 * Fetches the applications for a specific job.
 * @param {string} jobId - The ID of the job posting
 * @returns {Promise<Array>} The list of applications
 */
export async function getJobApplications(jobId) {
  const res = await fetch(`/api/jobs/dashboard/${jobId}/applications`);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to load applications');
  }
  const data = await res.json();
  return data.applications || [];
}

/**
 * Updates the status of a specific job application.
 * @param {string} jobId - The ID of the job posting
 * @param {string} applicationId - The ID of the application to update
 * @param {string} newStatus - The new status ('shortlisted', 'rejected', 'pending')
 * @returns {Promise<Object>} The response data
 */
export async function updateApplicationStatus(jobId, applicationId, newStatus) {
  const res = await fetch(`/api/jobs/dashboard/${jobId}/applications`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ applicationId, status: newStatus })
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to update status');
  }
  return res.json();
}

/**
 * Submits a new job posting.
 * @param {Object} jobData - The data for the new job
 * @returns {Promise<Object>} The created job data
 */
export async function createJobPosting(jobData) {
  const res = await fetch('/api/jobs/post', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(jobData),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to submit job. Please try again.');
  }
  return data.job;
}
