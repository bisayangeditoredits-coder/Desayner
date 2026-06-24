import React, { useState } from 'react';
import { X, Upload, Loader2, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function ApplyModal({ job, user, onClose }) {
  const [formData, setFormData] = useState({ 
    name: user?.user_metadata?.full_name || user?.user_metadata?.name || '', 
    email: user?.email || '', 
    portfolio: '', 
    coverLetter: '' 
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeError, setResumeError] = useState('');
  const [certified, setCertified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleResumeChange = (e) => {
    setResumeError('');
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setResumeError('Resume must be less than 10MB');
      e.target.value = '';
      setResumeFile(null);
      return;
    }

    if (file.type !== 'application/pdf') {
      setResumeError('Only PDF files are allowed');
      e.target.value = '';
      setResumeFile(null);
      return;
    }

    setResumeFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resumeFile) {
      setResumeError('Please attach your resume');
      return;
    }
    if (!certified) {
      setError('You must certify that your application is accurate.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', resumeFile);
      uploadFormData.append('jobId', job.id);

      const uploadRes = await fetch('/api/jobs/apply/upload', {
        method: 'POST',
        body: uploadFormData
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json();
        throw new Error(errData.error || 'Failed to securely upload resume');
      }
      
      const { fileUrl } = await uploadRes.json();

      const submitRes = await fetch('/api/jobs/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: job.id,
          designer_name: formData.name,
          designer_email: formData.email,
          portfolio_url: formData.portfolio,
          cover_letter: formData.coverLetter,
          resume_url: fileUrl
        })
      });

      if (!submitRes.ok) {
        const errData = await submitRes.json();
        throw new Error(errData.error || 'Failed to submit application');
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '1rem'
    }}>
      <div style={{
        background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '650px',
        maxHeight: '90vh', overflowY: 'auto', position: 'relative',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        
        <button onClick={onClose} style={{
          position: 'absolute', top: '1.5rem', right: '1.5rem', background: '#f1f5f9',
          border: 'none', width: '36px', height: '36px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          color: '#64748b', transition: 'all 0.2s'
        }} onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'} onMouseOut={(e) => e.currentTarget.style.background = '#f1f5f9'}>
          <X size={20} />
        </button>

        <div style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <ShieldCheck size={20} color="#10b981" />
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>Apply Securely</h2>
          </div>
          <p style={{ margin: '0 0 1.5rem 0', color: '#64748b', fontSize: '0.95rem' }}>For <span style={{ fontWeight: 600 }}>{job.title}</span> at <span style={{ fontWeight: 600 }}>{job.company}</span></p>

          {success ? (
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
              <CheckCircle2 size={64} color="#10b981" style={{ margin: '0 auto 1.5rem' }} />
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>Application Verified & Sent!</h3>
              <p style={{ color: '#64748b', marginBottom: '2rem' }}>Your resume and portfolio have been securely submitted.</p>
              <button onClick={onClose} style={{
                background: '#f1f5f9', color: '#0f172a', border: 'none', padding: '0.8rem 2rem',
                borderRadius: '99px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer'
              }}>Close Window</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #f87171', color: '#b91c1c', padding: '1rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 500 }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="input-group">
                  <label>Full Name *</label>
                  <input required type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Jane Doe" />
                </div>
                <div className="input-group">
                  <label>Email Address *</label>
                  <input 
                    required 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    placeholder="jane@example.com" 
                    readOnly={!!user?.email}
                    style={user?.email ? { backgroundColor: '#f8fafc', color: '#64748b', cursor: 'not-allowed' } : {}}
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Desayner Portfolio URL *</label>
                <input required type="url" name="portfolio" value={formData.portfolio} onChange={handleChange} placeholder="https://desayner.com/yourprofile" />
              </div>

              <div className="input-group">
                <label>Resume (PDF only, Max 10MB) *</label>
                <div style={{
                  border: resumeError ? '2px dashed #ef4444' : '2px dashed #cbd5e1',
                  borderRadius: '16px', padding: '2rem', textAlign: 'center',
                  background: '#f8fafc', position: 'relative', transition: 'all 0.2s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                }}>
                  {resumeFile ? (
                    <>
                      <FileText size={32} color="#3b82f6" style={{ marginBottom: '0.5rem' }} />
                      <span style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>{resumeFile.name}</span>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{(resumeFile.size / 1024 / 1024).toFixed(2)} MB</span>
                    </>
                  ) : (
                    <>
                      <Upload size={32} color="#94a3b8" style={{ marginBottom: '0.5rem' }} />
                      <span style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>Click to upload resume</span>
                      <span style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>PDF only, up to 10MB</span>
                    </>
                  )}
                  <input 
                    type="file" accept="application/pdf" onChange={handleResumeChange} required={!resumeFile}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                  />
                </div>
                {resumeError && <span style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 500, marginTop: '0.5rem' }}>{resumeError}</span>}
              </div>

              <div className="input-group">
                <label>Cover Letter (Optional)</label>
                <textarea name="coverLetter" value={formData.coverLetter} onChange={handleChange} rows="3" placeholder="Why are you a good fit for this role?" />
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <input 
                  type="checkbox" 
                  id="certify" 
                  checked={certified} 
                  onChange={(e) => setCertified(e.target.checked)}
                  style={{ marginTop: '0.25rem', width: '1.2rem', height: '1.2rem', cursor: 'pointer' }} 
                />
                <label htmlFor="certify" style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, cursor: 'pointer' }}>
                  I certify that the information provided is accurate and my portfolio represents my own original work. I agree to the <a href="#" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>Terms and Conditions</a> and <a href="#" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</a>.
                </label>
              </div>

              <button type="submit" disabled={loading || !certified} style={{
                background: (!loading && certified) ? '#2563eb' : '#94a3b8', color: 'white', border: 'none', padding: '1rem',
                borderRadius: '99px', fontSize: '1rem', fontWeight: 600, cursor: (!loading && certified) ? 'pointer' : 'not-allowed',
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem',
                marginTop: '0.5rem', transition: 'background 0.2s', boxShadow: (!loading && certified) ? '0 4px 14px rgba(37, 99, 235, 0.2)' : 'none'
              }}>
                {loading ? <Loader2 className="spinner" size={20} /> : 'Submit Application'}
              </button>
            </form>
          )}
        </div>
      </div>

      <style jsx>{`
        .input-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .input-group label { font-size: 0.85rem; font-weight: 600; color: #475569; }
        .input-group input, .input-group textarea {
          padding: 0.7rem 1rem; font-size: 0.95rem; border: 1px solid #e2e8f0; border-radius: 12px;
          background: #ffffff; color: #0f172a; outline: none; font-family: inherit; transition: all 0.2s;
        }
        .input-group input:focus, .input-group textarea:focus {
          border-color: #94a3b8; box-shadow: 0 0 0 4px rgba(148, 163, 184, 0.1);
        }
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
