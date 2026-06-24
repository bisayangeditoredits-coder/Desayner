/**
 * Employer Service
 * Contains API calls for managing the employer's profile and verification status.
 */

/**
 * Fetches the current user's employer verification profile.
 * @returns {Promise<Object|null>} The employer profile object, or null if unverified
 */
export async function getEmployerVerification() {
  const res = await fetch('/api/jobs/employer/verify');
  if (res.status === 401) {
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    throw new Error('Failed to fetch verification status');
  }
  const data = await res.json();
  return data.profile;
}

/**
 * Submits employer verification details.
 * @param {Object} formData - The employer details (name, address, etc.)
 * @param {File|null} docFile - An optional document file for verification
 * @returns {Promise<Object>} The updated employer profile
 */
export async function submitEmployerVerification(formData, docFile) {
  let document_url = '';

  if (docFile) {
    const uploadRes = await fetch('/api/jobs/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentType: docFile.type })
    });
    const uploadData = await uploadRes.json();
    if (!uploadRes.ok) throw new Error(uploadData.error || 'Failed to get upload URL');

    const putRes = await fetch(uploadData.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': docFile.type },
      body: docFile,
    });

    if (!putRes.ok) throw new Error('Failed to upload document');
    document_url = uploadData.publicUrl;
  }

  const res = await fetch('/api/jobs/employer/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...formData, document_url })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to submit verification');
  
  return data.profile;
}
