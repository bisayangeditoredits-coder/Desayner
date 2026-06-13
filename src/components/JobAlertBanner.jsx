'use client';

import { Mail } from 'lucide-react';
import { useState } from 'react';

export default function JobAlertBanner() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    // Mock API call
    setTimeout(() => {
      setSubscribed(true);
      setEmail('');
    }, 500);
  };

  if (subscribed) {
    return (
      <div style={{
        background: '#f0fdf4',
        border: '1px solid #dcfce7',
        borderRadius: '0',
        padding: '2rem',
        textAlign: 'center',
        gridColumn: '1 / -1',
        margin: '1rem 0'
      }}>
        <h3 style={{ color: '#166534', fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>You're all set! 🎉</h3>
        <p style={{ color: '#15803d', margin: 0 }}>We'll send the best remote jobs to your inbox weekly.</p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      borderRadius: '0',
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gridColumn: '1 / -1',
      margin: '1rem 0',
      boxShadow: '0 10px 25px rgba(15, 23, 42, 0.15)',
      color: 'white'
    }}>
      <div style={{ 
        width: '48px', 
        height: '48px', 
        background: 'rgba(255, 230, 0, 0.1)', 
        borderRadius: '50%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        marginBottom: '1rem'
      }}>
        <Mail size={24} color="#FFE600" />
      </div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.02em', marginBottom: '0.5rem', marginTop: 0 }}>
        Never miss a remote opportunity
      </h3>
      <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '1.5rem', maxWidth: '400px', lineHeight: 1.5 }}>
        Join 10,000+ professionals getting the best remote and tech jobs delivered directly to their inbox every week.
      </p>

      <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: '0.5rem', width: '100%', maxWidth: '350px' }}>
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email" 
          required
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            borderRadius: '0',
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.05)',
            color: 'white',
            outline: 'none',
            fontSize: '0.9rem'
          }}
        />
        <button 
          type="submit"
          style={{
            background: '#FFE600',
            color: '#000000',
            border: 'none',
            padding: '0 1.25rem',
            borderRadius: '0',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 4px 14px rgba(255, 230, 0, 0.2)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 230, 0, 0.3)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(255, 230, 0, 0.2)';
          }}
        >
          Subscribe
        </button>
      </form>
    </div>
  );
}
