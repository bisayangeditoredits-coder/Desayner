'use client';
import { useState, useRef } from 'react';
import { X, Upload, Loader2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import imageCompression from 'browser-image-compression';

export default function SubmitContestModal({ contestId, isOpen, onClose, onSubmitted }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [socialLink, setSocialLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }
    
    // Simplistic check; the server will enforce webp or convert if needed
    if (!selected.type.startsWith('image/')) {
      setError('Must be an image file');
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title || !contactEmail || !contactPhone || !socialLink) {
      setError('Title, Image, Email, Phone, and Social Link are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Compress images before sending to prevent 413 Request Entity Too Large
      const coverOptions = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/webp'
      };
      const thumbOptions = {
        maxSizeMB: 0.1,
        maxWidthOrHeight: 600,
        useWebWorker: true,
        fileType: 'image/webp'
      };

      const [compressedCover, compressedThumb] = await Promise.all([
        imageCompression(file, coverOptions),
        imageCompression(file, thumbOptions)
      ]);

      const formData = new FormData();
      formData.append('cover', compressedCover, 'cover.webp');
      formData.append('thumb', compressedThumb, 'thumb.webp');
      formData.append('folder', 'contests');

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      let uploadData;
      try {
        uploadData = await uploadRes.json();
      } catch (parseErr) {
        throw new Error('Upload server returned an invalid response (might be too large).');
      }
      
      if (!uploadRes.ok) throw new Error(uploadData?.error || 'Upload failed');

      // 2. Submit to database
      const submitRes = await fetch(`/api/contests/${contestId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          imageUrl: uploadData.publicUrl,
          contactEmail,
          contactPhone,
          socialLink
        })
      });
      const submitData = await submitRes.json();

      if (!submitRes.ok) throw new Error(submitData.error || 'Submission failed');

      onSubmitted(submitData.submission);
      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)'
      }}>
        <div style={{
          background: 'white', width: '100%', maxWidth: '450px', borderRadius: '16px', overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)', padding: '2.5rem 2rem', textAlign: 'center'
        }}>
          <div style={{ width: '70px', height: '70px', background: '#fef3c7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
            <span style={{ fontSize: '36px' }}>🎉</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>Submission Received!</h2>
          <p style={{ color: '#475569', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Your design is officially in the contest! <strong>To win, you need votes.</strong><br/>
            Share this link with your friends and encourage them to vote for your entry!
          </p>

          <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
            <input 
              type="text" 
              readOnly 
              value={typeof window !== 'undefined' ? `${window.location.origin}/contests/${contestId}` : ''}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#334155', fontSize: '0.85rem' }}
            />
            <button 
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/contests/${contestId}`);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              style={{ padding: '0.5rem 1rem', background: copied ? '#10b981' : '#fde047', color: '#0f172a', border: 'none', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>

          <button 
            onClick={() => {
              setIsSuccess(false);
              onClose();
            }}
            style={{ width: '100%', padding: '0.875rem', background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}
          >
            Awesome, let&apos;s go!
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: 'white', width: '100%', maxWidth: '500px', borderRadius: '16px', overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
      }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e8e8e8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Submit Entry</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          {error && (
            <div style={{ background: '#fef2f2', color: '#ef4444', padding: '0.75rem', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem', color: '#334155' }}>
              Design Title *
            </label>
            <input 
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Give your design a catchy name"
              disabled={loading}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
              required
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem', color: '#334155' }}>
              Upload Image (Max 5MB) *
            </label>
            <div 
              onClick={() => !loading && fileInputRef.current?.click()}
              style={{ 
                border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '2rem', textAlign: 'center',
                cursor: loading ? 'not-allowed' : 'pointer', background: '#f8fafc', transition: 'background 0.2s',
                position: 'relative', overflow: 'hidden'
              }}
            >
              {preview ? (
                <Image src={preview} alt="Preview" fill style={{ objectFit: 'contain' }} />
              ) : (
                <div style={{ color: '#64748b' }}>
                  <Upload size={32} style={{ margin: '0 auto 1rem auto', color: '#94a3b8' }} />
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, margin: 0 }}>Click to browse</p>
                  <p style={{ fontSize: '0.75rem', margin: '0.25rem 0 0 0' }}>JPG, PNG, WebP supported</p>
                </div>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange} 
              accept="image/*"
              style={{ display: 'none' }} 
            />
            {preview && (
              <button 
                type="button" 
                onClick={() => { setFile(null); setPreview(''); }}
                disabled={loading}
                style={{ marginTop: '0.5rem', background: 'none', border: 'none', color: '#ef4444', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
              >
                Remove Image
              </button>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem', color: '#334155' }}>
              Description (Optional)
            </label>
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Tell us a bit about your concept..."
              disabled={loading}
              rows={2}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem', color: '#334155' }}>
                Contact Email *
              </label>
              <input 
                type="email" 
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
                placeholder="For prize claiming"
                disabled={loading}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem', color: '#334155' }}>
                Phone Number *
              </label>
              <input 
                type="text" 
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
                placeholder="e.g. 09123456789"
                disabled={loading}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem', color: '#334155' }}>
              Social Media Link *
            </label>
            <input 
              type="url" 
              value={socialLink}
              onChange={e => setSocialLink(e.target.value)}
              placeholder="Facebook, Instagram, or Portfolio link"
              disabled={loading}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button 
              type="button" 
              onClick={onClose}
              disabled={loading}
              style={{ padding: '0.75rem 1.5rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading || !file || !title || !contactEmail || !contactPhone || !socialLink}
              style={{ padding: '0.75rem 1.5rem', background: '#2d43e8', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: loading || !file || !title || !contactEmail || !contactPhone || !socialLink ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: loading || !file || !title || !contactEmail || !contactPhone || !socialLink ? 0.7 : 1 }}
            >
              {loading && <Loader2 size={16} className="spin" />}
              Submit Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
