'use client';
import { useState, Suspense, useEffect } from 'react';
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

  // Optional: check if user is actually authenticated
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        // If not authenticated, they shouldn't be here
        setError('You do not have a valid session to reset your password. Please request a new link.');
      }
    });
  }, []);

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

    const supabase = createClient();
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
          
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{
              width: '40px', height: '40px', background: '#5b45f4',
              maskImage: 'url(/favicon_io/android-chrome-192x192%20rounded.png)',
              WebkitMaskImage: 'url(/favicon_io/android-chrome-192x192%20rounded.png)',
              maskSize: 'contain', WebkitMaskSize: 'contain', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat'
            }} />
          </div>

          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0a0a0a', marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>
            Set new password
          </h1>
          <p style={{ fontSize: '0.95rem', color: '#64748b', marginBottom: '2.5rem', lineHeight: '1.5' }}>
            Your new password must be different to previously used passwords.
          </p>

          {success ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 2rem', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc' }}>
              <div style={{ width: '48px', height: '48px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <CheckCircle2 size={24} color="#16a34a" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0a0a0a', marginBottom: '0.5rem' }}>Password reset</h3>
              <p style={{ fontSize: '0.95rem', color: '#64748b', marginBottom: '2rem', lineHeight: '1.5' }}>
                Your password has been successfully reset. <br/>
                Click below to continue to the dashboard.
              </p>
              <Link
                href="/"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '100%', padding: '0.95rem', borderRadius: '8px', background: '#5b45f4',
                  color: 'white', border: 'none', cursor: 'pointer', textDecoration: 'none',
                  fontWeight: 600, fontSize: '0.95rem', transition: 'background 0.2s',
                  boxShadow: '0 4px 12px rgba(91, 69, 244, 0.2)'
                }}
                onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
                onMouseOut={e => e.currentTarget.style.opacity = '1'}
              >
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#0a0a0a', marginBottom: '0.6rem' }}>
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
                      width: '100%', padding: '0.95rem 3rem 0.95rem 1rem', borderRadius: '8px',
                      border: '1px solid #e2e8f0', fontSize: '0.95rem', color: '#0a0a0a',
                      background: '#ffffff', boxSizing: 'border-box', outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#5b45f4'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    style={{
                      position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#0a0a0a', marginBottom: '0.6rem' }}>
                  Confirm New Password <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
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
                {loading ? 'Resetting password...' : 'Reset password'}
              </button>
            </form>
          )}

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

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
