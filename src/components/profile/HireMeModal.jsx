import React, { useState, useEffect } from 'react';
import { X, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Turnstile } from '@marsidev/react-turnstile';

export default function HireMeModal({ isOpen, onClose, targetUserId, targetUserName }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [turnstileToken, setTurnstileToken] = useState(null);
  
  const [formData, setFormData] = useState({
    projectType: 'Web Design',
    budget: '',
    engagementType: 'Project-based',
    message: ''
  });

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUser(user);
    });
  }, [supabase]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setSuccess(false);
        setError(null);
        setTurnstileToken(null);
        setFormData({
          projectType: 'Web Design',
          budget: '',
          engagementType: 'Project-based',
          message: ''
        });
      }, 300);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!currentUser) {
      // Direct them to login if somehow they clicked it without being authenticated
      router.push('/login');
      return;
    }

    if (formData.message.trim().length < 50) {
      setError('Message is too short. Please provide at least 50 characters describing your project.');
      return;
    }

    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;
    if (urlRegex.test(formData.message)) {
      setError('For security reasons, links (URLs) are not allowed in the initial inquiry message.');
      return;
    }

    if (!turnstileToken && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
      setError('Please complete the security challenge.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver_id: targetUserId,
          projectType: formData.projectType,
          budget: formData.budget || 'Not specified',
          engagementType: formData.engagementType,
          message: formData.message,
          turnstileToken: turnstileToken,
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send inquiry.');
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2500);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        style={{
          background: 'white',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '480px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#231f20', margin: 0 }}>Hire {targetUserName}</h2>
            <p style={{ fontSize: '0.85rem', color: '#9b9b9b', margin: '0.2rem 0 0 0' }}>Send an inquiry directly to their inbox</p>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', color: '#9b9b9b' }}
          >
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <CheckCircle2 size={48} color="#16a34a" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#231f20', marginBottom: '0.5rem' }}>Inquiry Sent!</h3>
            <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>{targetUserName} has received your message and will get back to you soon.</p>
          </div>
        ) : !currentUser ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <p style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#231f20' }}>Please log in to send inquiries.</p>
            <button 
              onClick={() => router.push('/login')}
              className="btn btn-dark"
              style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem' }}
            >
              Go to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
            {error && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.75rem 1rem', background: '#fee2e2', color: '#ef4444', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                <AlertCircle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem', color: '#231f20' }}>Project Type</label>
              <select 
                value={formData.projectType}
                onChange={e => setFormData({ ...formData, projectType: e.target.value })}
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none' }}
              >
                <option>Web Design</option>
                <option>Branding & Logo</option>
                <option>UI/UX App Design</option>
                <option>Illustration</option>
                <option>Other</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem', color: '#231f20' }}>Engagement</label>
                <select 
                  value={formData.engagementType}
                  onChange={e => setFormData({ ...formData, engagementType: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none' }}
                >
                  <option>Project-based</option>
                  <option>Long-term / Full-time</option>
                  <option>Hourly Contract</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem', color: '#231f20' }}>Budget (Optional)</label>
                <input 
                  type="text"
                  placeholder="e.g. $1,000 or $50/hr"
                  value={formData.budget}
                  onChange={e => setFormData({ ...formData, budget: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem', color: '#231f20' }}>Project Details</label>
              <textarea 
                placeholder="Describe your project, timeline, and any specific requirements (min 50 characters)..."
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
                rows={4}
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem', fontFamily: 'inherit', resize: 'vertical', outline: 'none' }}
              />
              <p style={{ fontSize: '0.75rem', color: formData.message.length < 50 ? '#ef4444' : '#16a34a', marginTop: '0.4rem' }}>
                {formData.message.length} / 50 min characters
              </p>
            </div>

            {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
              <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                <Turnstile 
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} 
                  onSuccess={(token) => setTurnstileToken(token)}
                  onError={() => setError("Security challenge failed. Please try again.")}
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button 
                type="button" 
                onClick={onClose}
                className="btn btn-outline"
                style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading}
                style={{ 
                  padding: '0.6rem 1.25rem', 
                  fontSize: '0.85rem', 
                  fontWeight: 700, 
                  background: '#2d43e8', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                {loading ? 'Sending...' : (
                  <>
                    <Send size={14} /> Send Inquiry
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
