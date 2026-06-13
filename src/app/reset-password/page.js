'use client';
import { useState, Suspense, useEffect, useMemo} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Eye, EyeOff, Lock, CheckCircle2 } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  // Optional: check if user is actually authenticated
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        // If not authenticated, they shouldn't be here
        setError('You do not have a valid session to reset your password. Please request a new link.');
      }
    });
  }, [supabase]);

  async function handleUpdatePassword(e) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password should be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    const { error } = await supabase.auth.updateUser({ password });

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
              Account Recovery
            </p>
            <h2 style={{
              fontSize: 'clamp(1.6rem, 3vw, 2.4rem)',
              fontWeight: 900,
              color: 'white',
              lineHeight: 1.2,
              letterSpacing: '-0.03em',
              marginBottom: '0.75rem',
            }}>
              Get back to<br />designing.
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
              Set a new password to recover access<br />to your Desayner portfolio.
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
          
          <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
            <img src="/desayner-logo.png" alt="Desayner" style={{ width: 160, height: 'auto' }} />
          </div>

          <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#231f20', marginBottom: '0.4rem', letterSpacing: '-0.03em' }}>
            Set new password
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '2.5rem', lineHeight: '1.5' }}>
            Your new password must be different to previously used passwords.
          </p>

          {success ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 2rem', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc' }}>
              <div style={{ width: '48px', height: '48px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <CheckCircle2 size={24} color="#16a34a" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#231f20', marginBottom: '0.5rem' }}>Password reset</h3>
              <p style={{ fontSize: '0.95rem', color: '#64748b', marginBottom: '2rem', lineHeight: '1.5' }}>
                Your password has been successfully reset. <br/>
                Click below to continue to the dashboard.
              </p>
              <Link
                href="/"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '100%', padding: '0.95rem', borderRadius: '8px', background: '#231f20',
                  color: 'white', border: 'none', cursor: 'pointer', textDecoration: 'none',
                  fontWeight: 600, fontSize: '0.95rem', transition: 'background 0.2s',
                }}
                onMouseOver={e => e.currentTarget.style.background = '#2d43e8'}
                onMouseOut={e => e.currentTarget.style.background = '#231f20'}
              >
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#231f20', marginBottom: '0.5rem' }}>
                  New Password <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Must be at least 6 characters"
                    required
                    style={{
                      width: '100%', padding: '0.85rem 3rem 0.85rem 1rem', borderRadius: '8px',
                      border: '1px solid #e2e8f0', fontSize: '0.9rem', color: '#231f20',
                      background: '#fafafa', boxSizing: 'border-box', outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#2d43e8'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    style={{
                      position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#231f20', marginBottom: '0.5rem' }}>
                  Confirm New Password <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                  style={{
                    width: '100%', padding: '0.85rem 1rem', borderRadius: '8px',
                    border: '1px solid #e2e8f0', fontSize: '0.9rem', color: '#231f20',
                    background: '#fafafa', boxSizing: 'border-box', outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2d43e8'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              {error && (
                <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: '#fff1f1', border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.85rem' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '0.9rem', borderRadius: '8px', background: '#231f20',
                  color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '0.5rem', opacity: loading ? 0.75 : 1,
                  marginTop: '0.25rem', transition: 'background 0.2s, opacity 0.2s'
                }}
                onMouseOver={e => !loading && (e.currentTarget.style.background = '#2d43e8')}
                onMouseOut={e => !loading && (e.currentTarget.style.background = '#231f20')}
              >
                {loading && <Loader2 size={15} strokeWidth={2} style={{ animation: 'spin 1s linear infinite' }} />}
                {loading ? 'Resetting password...' : 'Reset password'}
              </button>
            </form>
          )}

        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .login-video-panel { display: block !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
