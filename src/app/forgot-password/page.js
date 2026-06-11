'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Loader2, ArrowLeft, Mail } from 'lucide-react';

function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleResetPassword(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#ffffff', fontFamily: '"Inter", "Segoe UI", sans-serif' }}>
      
      {/* Left Column: Form */}
      <div style={{
        flex: '1',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '3rem 8%',
        maxWidth: '700px',
        margin: '0 auto'
      }}>
        <div style={{ width: '100%', maxWidth: '440px', margin: '0 auto' }}>
          
          <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none', marginBottom: '3rem' }}>
            <ArrowLeft size={16} /> Back to log in
          </Link>

          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0a0a0a', marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>
            Forgot password?
          </h1>
          <p style={{ fontSize: '0.95rem', color: '#64748b', marginBottom: '2.5rem', lineHeight: '1.5' }}>
            No worries, we&apos;ll send you reset instructions.
          </p>

          {success ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 2rem', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc' }}>
              <div style={{ width: '48px', height: '48px', background: '#e0e7ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <Mail size={24} color="#5b45f4" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0a0a0a', marginBottom: '0.5rem' }}>Check your email</h3>
              <p style={{ fontSize: '0.95rem', color: '#64748b', marginBottom: '2rem', lineHeight: '1.5' }}>
                We sent a password reset link to <br/>
                <strong style={{ color: '#0a0a0a' }}>{email}</strong>
              </p>
              <button
                onClick={() => setSuccess(false)}
                style={{
                  width: '100%', padding: '0.95rem', borderRadius: '8px', background: 'white',
                  color: '#0a0a0a', border: '1px solid #e2e8f0', cursor: 'pointer',
                  fontWeight: 600, fontSize: '0.95rem', transition: 'background 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseOut={e => e.currentTarget.style.background = 'white'}
              >
                Try another email address
              </button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#0a0a0a', marginBottom: '0.6rem' }}>
                  Email <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your mail address"
                  required
                  style={{
                    width: '100%', padding: '0.95rem 1rem', borderRadius: '8px',
                    border: '1px solid #e2e8f0', fontSize: '0.95rem', color: '#0a0a0a',
                    background: '#ffffff', boxSizing: 'border-box', outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#5b45f4'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              {error && (
                <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: '#fff1f1', border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.875rem' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '1rem', borderRadius: '8px', background: '#5b45f4',
                  color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '0.5rem', opacity: loading ? 0.8 : 1,
                  marginTop: '0.5rem', transition: 'opacity 0.2s', boxShadow: '0 4px 12px rgba(91, 69, 244, 0.2)'
                }}
                onMouseOver={e => !loading && (e.currentTarget.style.opacity = '0.9')}
                onMouseOut={e => !loading && (e.currentTarget.style.opacity = '1')}
              >
                {loading && <Loader2 size={16} strokeWidth={1.5} style={{ animation: 'spin 1s linear infinite' }} />}
                {loading ? 'Sending link...' : 'Reset password'}
              </button>
            </form>
          )}

          <p style={{ textAlign: 'center', marginTop: '2.5rem', fontSize: '0.875rem', color: '#0a0a0a', fontWeight: 500 }}>
            Remember your password?{' '}
            <Link href="/login" style={{ color: '#5b45f4', fontWeight: 600, textDecoration: 'underline' }}>
              Log in
            </Link>
          </p>
        </div>
      </div>

      {/* Right Column: Abstract Background */}
      <div style={{
        flex: '1.2',
        display: 'none',
        backgroundImage: 'url(/login-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }} className="desktop-bg-panel" />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 900px) {
          .desktop-bg-panel { display: block !important; }
        }
      `}</style>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  );
}
