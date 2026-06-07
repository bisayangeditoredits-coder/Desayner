'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff, Loader2, Check } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/';

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  async function handleGoogleLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}` },
    });
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
          
          {/* Logo Placeholder (similar to screenshot) */}
          <div style={{ marginBottom: '3rem' }}>
            <div style={{
              width: '40px', height: '40px', background: '#5b45f4',
              maskImage: 'url(/favicon_io/android-chrome-192x192%20rounded.png)',
              WebkitMaskImage: 'url(/favicon_io/android-chrome-192x192%20rounded.png)',
              maskSize: 'contain', WebkitMaskSize: 'contain', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat'
            }} />
          </div>

          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0a0a0a', marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>
            Welcome back !
          </h1>
          <p style={{ fontSize: '0.95rem', color: '#64748b', marginBottom: '2.5rem' }}>
            Enter to get unlimited access to data & information.
          </p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#0a0a0a', marginBottom: '0.6rem' }}>
                Password <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
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

            <div style={{ display: 'flex', alignItems: 'center', justifycontent: 'space-between', justifyContent: 'space-between', marginTop: '0.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <div style={{
                  width: '18px', height: '18px', borderRadius: '4px', border: rememberMe ? 'none' : '1px solid #cbd5e1',
                  background: rememberMe ? '#5b45f4' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.2s'
                }}>
                  {rememberMe && <Check size={12} color="white" strokeWidth={3} />}
                </div>
                <input type="checkbox" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} style={{ display: 'none' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0a0a0a' }}>Remember me</span>
              </label>

              <Link href="/forgot-password" style={{ fontSize: '0.85rem', color: '#5b45f4', fontWeight: 600, textDecoration: 'none' }}>
                Forgot your password ?
              </Link>
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
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '2rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>Or, Login with</span>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          </div>

          <button
            onClick={handleGoogleLogin}
            style={{
              width: '100%', padding: '0.95rem', border: '1px solid #e2e8f0',
              borderRadius: '8px', background: 'white', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifycontent: 'center', justifyContent: 'center',
              gap: '0.75rem', fontWeight: 600, fontSize: '0.95rem',
              color: '#0a0a0a', transition: 'background 0.2s',
            }}
            onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
            onMouseOut={e => e.currentTarget.style.background = 'white'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign up with google
          </button>

          <p style={{ textAlign: 'center', marginTop: '2.5rem', fontSize: '0.875rem', color: '#0a0a0a', fontWeight: 500 }}>
            Don&apos;t have an account ?{' '}
            <Link href="/signup" style={{ color: '#5b45f4', fontWeight: 600, textDecoration: 'underline' }}>
              Register here
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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
