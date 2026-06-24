'use client';
import { useState, useEffect } from 'react';
import { ShieldCheck, Loader2, UploadCloud, AlertCircle, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { COUNTRIES } from '@/utils/countries';

export default function EmployerVerification({ profile, onVerifySubmit }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    company_legal_name: '',
    business_registration_number: '',
    company_address: '',
    company_country: '',
    contact_person_name: '',
  });

  const [docFile, setDocFile] = useState(null);
  const [docPreview, setDocPreview] = useState('');
  const [docError, setDocError] = useState('');

  if (profile) {
    if (profile.verification_status === 'pending_review') {
      return (
        <div style={{ background: '#fef9c3', border: '1px solid #fef08a', padding: '2rem', borderRadius: '16px', textAlign: 'center' }}>
          <ShieldCheck size={48} color="#ca8a04" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#854d0e', marginBottom: '0.5rem' }}>Verification Pending</h2>
          <p style={{ color: '#a16207', margin: 0, maxWidth: '400px', margin: '0 auto' }}>
            We are currently reviewing your business information. This usually takes 1-2 business days.
            Your job postings will remain hidden from the public until approved.
          </p>
        </div>
      );
    }
    if (profile.verification_status === 'rejected') {
      return (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', padding: '2rem', borderRadius: '16px', textAlign: 'center' }}>
          <AlertCircle size={48} color="#dc2626" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#991b1b', marginBottom: '0.5rem' }}>Verification Rejected</h2>
          <p style={{ color: '#b91c1c', margin: 0 }}>
            Unfortunately, we could not verify your business information. Please contact support.
          </p>
        </div>
      );
    }
  }

  const handleDocChange = (e) => {
    setDocError('');
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setDocError('File size must be less than 5MB');
      return;
    }

    setDocFile(file);
    if (file.type.startsWith('image/')) {
      setDocPreview(URL.createObjectURL(file));
    } else {
      setDocPreview('document'); // placeholder for pdf
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!docFile) {
        throw new Error('A valid business registration document or ID is strictly required.');
      }
      if (!formData.company_country) {
        throw new Error('Please select a country.');
      }

      let document_key = '';

      if (docFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', docFile);

        const uploadRes = await fetch('/api/jobs/verification/upload', {
          method: 'POST',
          body: uploadFormData
        });
        
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Failed to securely upload document');

        document_key = uploadData.key;
      }

      const res = await fetch('/api/jobs/employer/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, document_key })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      onVerifySubmit(data.profile);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      background: '#ffffff', 
      borderRadius: '24px', 
      padding: '3rem', 
      border: '1px solid #e2e8f0', 
      boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)' 
    }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{ 
          width: '72px', 
          height: '72px', 
          background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', 
          borderRadius: '20px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto 1.5rem',
          boxShadow: '0 4px 14px rgba(59, 130, 246, 0.15)',
          border: '1px solid #bfdbfe'
        }}>
          <ShieldCheck size={36} color="#2563eb" strokeWidth={2} />
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem', letterSpacing: '-0.03em' }}>
          Verify Your Business
        </h2>
        <p style={{ color: '#64748b', fontSize: '1.05rem', maxWidth: '500px', margin: '0 auto', lineHeight: 1.6 }}>
          To maintain a premium standard, we require all employers to submit verification details before postings go live.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '550px', margin: '0 auto' }}>
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #f87171', color: '#b91c1c', padding: '1rem', borderRadius: '12px', fontSize: '0.95rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={20} /> {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="input-group">
            <label>Company Legal Name <span style={{ color: '#ef4444' }}>*</span></label>
            <input required type="text" value={formData.company_legal_name} onChange={e => setFormData({...formData, company_legal_name: e.target.value})} placeholder="Registered business name" />
          </div>

          <div className="input-group">
            <label>Contact Person Name <span style={{ color: '#ef4444' }}>*</span></label>
            <input required type="text" value={formData.contact_person_name} onChange={e => setFormData({...formData, contact_person_name: e.target.value})} placeholder="Your full name" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="input-group">
            <label>Company Country <span style={{ color: '#ef4444' }}>*</span></label>
            <select required value={formData.company_country} onChange={e => setFormData({...formData, company_country: e.target.value})} style={{ padding: '0.9rem 1.2rem', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc', color: formData.company_country ? '#0f172a' : '#94a3b8', fontSize: '1rem', outline: 'none' }}>
              <option value="" disabled>Select Country</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label>Company Registration / Tax ID <span style={{ color: '#ef4444' }}>*</span></label>
            <input required type="text" value={formData.business_registration_number} onChange={e => setFormData({...formData, business_registration_number: e.target.value})} placeholder="EIN, VAT, SEC, etc." />
          </div>
        </div>

        <div className="input-group">
          <label>Business Address <span style={{ color: '#ef4444' }}>*</span></label>
          <textarea required value={formData.company_address} onChange={e => setFormData({...formData, company_address: e.target.value})} rows="3" placeholder="Full operating address"></textarea>
        </div>

        <div className="input-group">
          <label>Company Registration / Tax ID <span style={{ color: '#ef4444' }}>*</span></label>
          <input required type="text" value={formData.business_registration_number} onChange={e => setFormData({...formData, business_registration_number: e.target.value})} placeholder="e.g. EIN, VAT, Company No, or local equivalent" />
        </div>

        <div className="input-group" style={{ marginTop: '0.5rem' }}>
          <label>Upload Valid ID or Business Permit <span style={{ color: '#ef4444' }}>*</span></label>
          <div style={{ 
            marginTop: '0.5rem',
            border: docError ? '2px dashed #ef4444' : '2px dashed #cbd5e1',
            borderRadius: '16px', 
            padding: '2rem', 
            textAlign: 'center',
            background: '#f8fafc', 
            position: 'relative', 
            transition: 'all 0.2s',
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center'
          }}>
            {docFile ? (
              <>
                <ShieldCheck size={32} color="#10b981" style={{ marginBottom: '0.5rem' }} />
                <span style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>{docFile.name}</span>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{(docFile.size / 1024 / 1024).toFixed(2)} MB</span>
              </>
            ) : (
              <>
                <UploadCloud size={32} color="#94a3b8" style={{ marginBottom: '0.5rem' }} />
                <span style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>Click to upload document</span>
                <span style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>Image or PDF, up to 5MB</span>
              </>
            )}
            <input 
              type="file" accept="image/*,.pdf" onChange={handleDocChange} 
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
            />
          </div>
          {docError && <span style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 500, marginTop: '0.5rem' }}>{docError}</span>}
        </div>

        <button type="submit" disabled={loading} style={{ 
          background: '#2563eb', 
          color: 'white', 
          border: 'none', 
          padding: '1.2rem', 
          borderRadius: '99px', 
          fontWeight: 700, 
          fontSize: '1.05rem', 
          marginTop: '1.5rem', 
          cursor: loading ? 'not-allowed' : 'pointer', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          gap: '0.5rem',
          transition: 'all 0.2s',
          boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
        }}
        onMouseOver={(e) => !loading && (e.currentTarget.style.background = '#1d4ed8')}
        onMouseOut={(e) => !loading && (e.currentTarget.style.background = '#2563eb')}
        >
          {loading ? <Loader2 className="spinner" size={24} /> : 'Submit for Verification'}
        </button>
      </form>

      <style jsx>{`
        .input-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .input-group label { font-size: 0.85rem; font-weight: 700; color: #475569; letter-spacing: 0.02em; }
        .input-group input, .input-group textarea { 
          padding: 0.9rem 1.2rem; 
          border: 1px solid #e2e8f0; 
          border-radius: 12px; 
          font-family: inherit; 
          font-size: 1rem; 
          color: #0f172a; 
          background: #f8fafc;
          outline: none; 
          transition: all 0.2s; 
        }
        .input-group input:focus, .input-group textarea:focus { 
          border-color: #3b82f6; 
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(59,130,246,0.1); 
        }
        .input-group input::placeholder, .input-group textarea::placeholder {
          color: #94a3b8;
        }
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
