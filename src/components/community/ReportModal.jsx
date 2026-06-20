'use client';
import { useState } from 'react';
import { Flag, X } from 'lucide-react';
import useToastStore from '@/store/useToastStore';

const REASONS = [
  { value: 'spam',           label: 'Spam or self-promotion' },
  { value: 'harassment',     label: 'Harassment or hate speech' },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'other',          label: 'Other' },
];

export default function ReportModal({ postId, onClose }) {
  const [reason, setReason]       = useState('spam');
  const [submitting, setSubmitting] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);

    const res = await fetch(`/api/community/posts/${postId}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });

    if (res.ok) {
      addToast({ type: 'success', message: "Report submitted. We'll review it soon." });
      onClose();
    } else {
      const data = await res.json().catch(() => ({}));
      addToast({ type: 'error', message: data.error || 'Could not submit report.' });
    }
    setSubmitting(false);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(15,23,42,0.45)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        pointerEvents: 'none',
      }}>
        <div style={{
          background: 'white', borderRadius: '16px', padding: '2rem',
          width: '100%', maxWidth: '420px', pointerEvents: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          animation: 'fadeUp 0.25s cubic-bezier(0.16,1,0.3,1)',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Flag size={16} color="#ef4444" />
              </div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>Report Post</h3>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4, display: 'flex', alignItems: 'center' }}>
              <X size={18} />
            </button>
          </div>

          <p style={{ fontSize: '0.83rem', color: '#64748b', marginBottom: '1.25rem', lineHeight: 1.5 }}>
            Why are you reporting this post? Our team will review it within 24 hours.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {REASONS.map((r) => (
                <label
                  key={r.value}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.65rem',
                    padding: '0.65rem 0.9rem', borderRadius: '8px', cursor: 'pointer',
                    border: '1.5px solid',
                    borderColor: reason === r.value ? '#2d43e8' : '#e8e8e8',
                    background:  reason === r.value ? '#eff1ff' : 'white',
                    transition: 'all 0.15s',
                    fontSize: '0.85rem',
                    fontWeight: reason === r.value ? 700 : 500,
                    color: reason === r.value ? '#2d43e8' : '#334155',
                  }}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    style={{ accentColor: '#2d43e8' }}
                  />
                  {r.label}
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1, padding: '0.75rem', borderRadius: '8px',
                  border: '1.5px solid #e8e8e8', background: 'white',
                  fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: '#334155',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  flex: 1, padding: '0.75rem', borderRadius: '8px',
                  background: '#ef4444', color: 'white', border: 'none',
                  fontSize: '0.875rem', fontWeight: 700,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1,
                  fontFamily: 'inherit', transition: 'opacity 0.15s',
                }}
              >
                {submitting ? 'Submitting…' : 'Submit Report'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
