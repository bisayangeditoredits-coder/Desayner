'use client';
import { useState, Suspense, useMemo} from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Loader2, ArrowLeft, Mail } from 'lucide-react';

function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  async function handleResetPassword(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

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
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      fontFamily: '"Inter", "Segoe UI", sans-serif',
      background: '#231f20',
    }}>

      {/* ── LEFT: video panel ── */}
      <div className="login-video-panel" style={{
        flex: '1.1',
        position: 'relative',
        overflow: 'hidden',
        display: 'none', // hidden on mobile, shown via CSS
      }}>
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.75,
          }}
        >
          <source src="/video-onboarding/welcome-to-desayner.mp4" type="video/mp4" />
        </video>

        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(45, 67, 232,0.35) 0%, rgba(0,0,0,0.55) 100%)',
          zIndex: 1,
        }} />

        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '3rem',
        }}>
          <img
            src="/desayner-logo-whiteversiom.png"
            alt="Desayner"
            style={{ width: 160, height: 'auto', marginBottom: 'auto', paddingTop: '2.5rem' }}
          />

          <div>
            <p style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#FFE600',
              marginBottom: '0.6rem',
            }}>
              Design Hub
            </p>
            <h2 style={{
              fontSize: 'clamp(1.6rem, 3vw, 2.4rem)',
              fontWeight: 900,
              color: 'white',
              lineHeight: 1.2,
              letterSpacing: '-0.03em',
              marginBottom: '0.75rem',
            }}>
              Create. Share.<br />Get Discovered.
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
              The platform for designers to showcase work,<br />get feedback, and grow together.
            </p>
          </div>
        </div>
      </div>

      {/* ── RIGHT: form panel ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#ffffff',
        padding: '3rem 2rem',
        minWidth: 0,
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          
          {/* Logo — always shown above the form */}
          <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
            <img src="/desayner-logo.png" alt="Desayner" style={{ width: 160, height: 'auto' }} />
          </div>

          <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', marginBottom: '2rem' }}>
            <ArrowLeft size={16} /> Back to log in
          </Link>

          <h1 style={{
            fontSize: '1.85rem',
            fontWeight: 900,
            color: '#231f20',
            marginBottom: '0.4rem',
            letterSpacing: '-0.03em',
          }}>
            Forgot password?
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '2rem' }}>
            No worries, we&apos;ll send you reset instructions.
          </p>

          {success ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 2rem', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc' }}>
              <div style={{ width: '48px', height: '48px', background: '#e0e7ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <Mail size={24} color="#2d43e8" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#231f20', marginBottom: '0.5rem' }}>Check your email</h3>
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '2rem', lineHeight: '1.5' }}>
                We sent a password reset link to <br/>
                <strong style={{ color: '#231f20' }}>{email}</strong>
              </p>
              <button
                onClick={() => setSuccess(false)}
                style={{
                  width: '100%', padding: '0.9rem', borderRadius: '8px', background: 'white',
                  color: '#231f20', border: '1px solid #e2e8f0', cursor: 'pointer',
                  fontWeight: 600, fontSize: '0.9rem', transition: 'background 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseOut={e => e.currentTarget.style.background = 'white'}
              >
                Try another email address
              </button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#231f20', marginBottom: '0.5rem' }}>
                  Email
                </label>
                <input
                  type="email"
                  className="login-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  style={{
                    width: '100%', padding: '0.85rem 1rem', borderRadius: 8,
                    border: '1px solid #e2e8f0', fontSize: '0.9rem', color: '#231f20',
                    background: '#fafafa', boxSizing: 'border-box', outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                />
              </div>

              {error && (
                <div style={{ padding: '0.7rem 1rem', borderRadius: 8, background: '#fff1f1', border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.85rem' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '0.9rem', borderRadius: 8,
                  background: '#231f20', color: 'white', border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700,
                  fontSize: '0.9rem', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '0.5rem',
                  opacity: loading ? 0.75 : 1, transition: 'opacity 0.2s, background 0.2s',
                  marginTop: '0.25rem',
                }}
                onMouseOver={e => !loading && (e.currentTarget.style.background = '#2d43e8')}
                onMouseOut={e => !loading && (e.currentTarget.style.background = '#231f20')}
              >
                {loading && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />}
                {loading ? 'Sending link...' : 'Reset password'}
              </button>
            </form>
          )}

          <p style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.85rem', color: '#64748b' }}>
            Remember your password?{' '}
            <Link href="/login" style={{ color: '#2d43e8', fontWeight: 700, textDecoration: 'none' }}>
              Log in
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .login-video-panel { display: block !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .login-input:focus { border-color: #2d43e8 !important; }
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
