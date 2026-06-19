'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function NewsletterSubscribe() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to subscribe');
      
      setStatus('success');
      setMessage('Thanks for subscribing!');
      setEmail('');
    } catch (err) {
      setStatus('error');
      setMessage(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '300px' }}>
      <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>Subscribe to Updates</h4>
      <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
        Get notified about new features, updates, and community news.
      </p>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            disabled={status === 'loading'}
            style={{
              flex: 1,
              padding: '0.6rem 0.8rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              outline: 'none',
              transition: 'border-color 0.2s',
              background: '#fff'
            }}
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            disabled={status === 'loading'}
            type="submit"
            style={{
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              background: '#2d43e8',
              color: '#fff',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: status === 'loading' ? 'not-allowed' : 'pointer',
              opacity: status === 'loading' ? 0.7 : 1
            }}
          >
            {status === 'loading' ? '...' : 'Subscribe'}
          </motion.button>
        </div>
        {message && (
          <p style={{ 
            fontSize: '0.8rem', 
            margin: 0, 
            color: status === 'success' ? '#10b981' : '#ef4444',
            fontWeight: 500
          }}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
