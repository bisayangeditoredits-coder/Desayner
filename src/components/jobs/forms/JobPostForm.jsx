'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, UploadCloud } from 'lucide-react';
import { createJobPosting } from '@/lib/services/jobsService';
import { COUNTRIES } from '@/utils/countries';

/**
 * JobPostForm Component
 * Renders the form for employers to post a new job.
 * Handles internal state (form data, logo upload, loading, errors).
 * @param {Object} props
 * @param {Function} props.onSuccess - Callback fired when a job is successfully posted
 */
export default function JobPostForm({ onSuccess }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: 'Remote - Worldwide',
    currency: 'USD',
    min_salary: '',
    max_salary: '',
    job_type: 'Full-Time',
    level: 'Mid',
    url: '',
    description: '',
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [logoError, setLogoError] = useState('');

  const handleLogoChange = (e) => {
    setLogoError('');
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setLogoError('Logo size must be less than 3MB');
      e.target.value = '';
      setLogoFile(null);
      setLogoPreview('');
      return;
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let finalLogoUrl = '';

      if (logoFile) {
        const uploadRes = await fetch('/api/jobs/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contentType: logoFile.type })
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Failed to get upload URL');

        const putRes = await fetch(uploadData.uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': logoFile.type },
          body: logoFile,
        });

        if (!putRes.ok) throw new Error('Failed to upload logo image to bucket');
        finalLogoUrl = uploadData.publicUrl;
      }

      const payload = { ...formData, logo: finalLogoUrl };

      await createJobPosting(payload);
      onSuccess();
    } catch (err) {
      setError(err.message);
      if (err.message.includes('log in')) {
        setTimeout(() => { router.push('/login'); }, 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#ffffff', borderRadius: '24px', padding: '3rem', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {error && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid #fca5a5', fontWeight: 600, fontSize: '0.95rem' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div className="input-group">
            <label>Job Title <span className="req">*</span></label>
            <input required type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Senior UI/UX Designer" />
          </div>
          <div className="input-group">
            <label>Company Name <span className="req">*</span></label>
            <input required type="text" name="company" value={formData.company} onChange={handleChange} placeholder="e.g. Acme Corp" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div className="input-group">
            <label>Location / Country <span className="req">*</span></label>
            <select name="location" value={formData.location} onChange={handleChange} required>
              <optgroup label="Remote">
                <option value="Remote - Worldwide">Remote - Worldwide</option>
                <option value="Remote - US Only">Remote - US Only</option>
                <option value="Remote - EMEA">Remote - EMEA</option>
                <option value="Remote - Asia">Remote - Asia</option>
              </optgroup>
              <optgroup label="Specific Countries">
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </optgroup>
            </select>
          </div>
          <div className="input-group">
            <label>Salary Range (Monthly)</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <select name="currency" value={formData.currency} onChange={handleChange} style={{ width: '90px' }}>
                <option value="USD">USD</option>
                <option value="PHP">PHP</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="AUD">AUD</option>
                <option value="CAD">CAD</option>
                <option value="SGD">SGD</option>
              </select>
              <input type="number" name="min_salary" value={formData.min_salary} onChange={handleChange} placeholder="Min" style={{ flex: 1, minWidth: 0 }} />
              <span style={{ color: '#94a3b8', fontWeight: 600 }}>-</span>
              <input type="number" name="max_salary" value={formData.max_salary} onChange={handleChange} placeholder="Max" style={{ flex: 1, minWidth: 0 }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div className="input-group">
            <label>Job Type</label>
            <select name="job_type" value={formData.job_type} onChange={handleChange}>
              <option>Full-Time</option>
              <option>Part-Time</option>
              <option>Contract</option>
              <option>Freelance</option>
            </select>
          </div>
          <div className="input-group">
            <label>Level</label>
            <select name="level" value={formData.level} onChange={handleChange}>
              <option>Junior</option>
              <option>Mid</option>
              <option>Senior</option>
              <option>Lead</option>
            </select>
          </div>
        </div>

        <div className="input-group" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '2rem' }}>
          <label>Company Logo <span style={{ fontWeight: 500, color: '#94a3b8' }}>(Max 3MB)</span></label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '0.5rem' }}>
            <div style={{ 
              width: '80px', height: '80px', borderRadius: '20px', background: '#f8fafc', 
              border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', flexShrink: 0
            }}>
              {logoPreview ? (
                <img src={logoPreview} alt="Logo Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <UploadCloud size={24} color="#94a3b8" />
              )}
            </div>
            
            <div style={{ position: 'relative', overflow: 'hidden', display: 'inline-block' }}>
              <button 
                type="button"
                style={{
                  background: '#f1f5f9', color: '#0f172a', border: '1px solid #e2e8f0', 
                  padding: '0.75rem 1.5rem', borderRadius: '99px', fontSize: '0.9rem', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}
              >
                Upload Image
              </button>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleLogoChange} 
                style={{ 
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                  opacity: 0, cursor: 'pointer' 
                }} 
              />
            </div>
          </div>
          {logoError && <span style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 500, marginTop: '0.5rem' }}>{logoError}</span>}
        </div>

        <div className="input-group" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '2rem' }}>
          <label>Application URL / Link <span style={{ fontWeight: 500, color: '#94a3b8' }}>(Optional)</span></label>
          <input type="url" name="url" value={formData.url} onChange={handleChange} placeholder="https://company.com/careers" />
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>If left blank, applicants will apply directly through Desayner.</p>
        </div>

        <div className="input-group">
          <label>Role Overview</label>
          <textarea name="description" value={formData.description} onChange={handleChange} rows="5" placeholder="Briefly describe the responsibilities, requirements, and benefits..."></textarea>
        </div>

        <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', margin: 0 }}>
            <input 
              type="checkbox" 
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.5 }}>
              I agree to the <a href="#" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>Terms and Conditions</a> and <a href="#" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</a>. I confirm that this job posting complies with Desayner's community guidelines.
            </span>
          </label>
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            type="submit" 
            disabled={loading || !agreedToTerms}
            style={{
              background: (!loading && agreedToTerms) ? '#2563eb' : '#94a3b8',
              color: 'white',
              border: 'none',
              padding: '1rem 2.5rem',
              borderRadius: '99px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: (!loading && agreedToTerms) ? 'pointer' : 'not-allowed',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'background 0.2s',
              boxShadow: (!loading && agreedToTerms) ? '0 8px 20px -6px rgba(37,99,235,0.4)' : 'none'
            }}
            onMouseOver={(e) => (!loading && agreedToTerms) && (e.currentTarget.style.background = '#1d4ed8')}
            onMouseOut={(e) => (!loading && agreedToTerms) && (e.currentTarget.style.background = '#2563eb')}
          >
            {loading ? <Loader2 className="spinner" size={20} /> : 'Submit Job Post'}
          </button>
        </div>

      </form>

      <style jsx>{`
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .input-group label {
          font-size: 0.9rem;
          font-weight: 700;
          color: #1e293b;
        }
        .req {
          color: #ef4444;
        }
        .input-group input, .input-group select, .input-group textarea {
          padding: 1rem 1.25rem;
          font-size: 1rem;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          background: #ffffff;
          color: #0f172a;
          outline: none;
          font-family: inherit;
          transition: all 0.2s;
        }
        .input-group input::placeholder, .input-group textarea::placeholder {
          color: #94a3b8;
        }
        .input-group input:focus, .input-group select:focus, .input-group textarea:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }
        .spinner {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
