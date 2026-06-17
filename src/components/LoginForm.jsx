'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff, Loader2, Check } from 'lucide-react';
import FeatureShowcase from '@/components/FeatureShowcase';
import { Turnstile } from '@marsidev/react-turnstile';

export default function LoginForm({ isModal = false }) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirectTo   = searchParams.get('redirectTo') || '/';

  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [showPw,     setShowPw]     = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');

  const supabase = useMemo(() => createClient(), []);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!turnstileToken) {
      setError('Please verify that you are human.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    if (isModal) { window.location.href = redirectTo; }
    else { router.push(redirectTo); router.refresh(); }
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}` },
    });
  }

  // ── Modal layout (unchanged compact version) ────────────────────────────────
  if (isModal) {
    return (
      <div style={{ padding: '2rem', fontFamily: '"Inter", "Segoe UI", sans-serif' }}>
        <div style={{ width: '100%', maxWidth: 400, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <img src="/desayner-logo.png" alt="Desayner" style={{ width: 160, height: 'auto' }} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#231f20', marginBottom: '0.4rem', letterSpacing: '-0.03em', textAlign: 'center' }}>
            Welcome back
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.75rem', textAlign: 'center' }}>
            Sign in to continue to Desayner
          </p>
          <FormFields
            email={email} setEmail={setEmail}
            password={password} setPassword={setPassword}
            showPw={showPw} setShowPw={setShowPw}
            rememberMe={rememberMe} setRememberMe={setRememberMe}
            loading={loading} error={error}
            handleLogin={handleLogin} handleGoogleLogin={handleGoogleLogin}
            setTurnstileToken={setTurnstileToken}
            isModal
          />
        </div>
      </div>
    );
  }

  // ── Full-page layout ─────────────────────────────────────────────────────────
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      fontFamily: '"Inter", "Segoe UI", sans-serif',
      background: '#231f20',
    }}>

      {/* ── LEFT: showcase panel ── */}
      <div className="login-video-panel" style={{
        flex: '1.1',
        position: 'relative',
        overflow: 'hidden',
        display: 'none', // hidden on mobile, shown via CSS
        background: '#020617',
      }}>
        <FeatureShowcase />

        {/* Content overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '4rem',
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)',
        }}>
          {/* Logo removed to prevent redundancy with the right panel */}

          {/* Tagline */}
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
        <div className="login-form-container" style={{ width: '100%', maxWidth: 420 }}>

          {/* Logo — always shown above the form */}
          <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
            <img src="/desayner-logo.png" alt="Desayner" style={{ width: 160, height: 'auto' }} />
          </div>

          <h1 style={{
            fontSize: '1.85rem',
            fontWeight: 900,
            color: '#231f20',
            marginBottom: '0.4rem',
            letterSpacing: '-0.03em',
          }}>
            Welcome back
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '2rem' }}>
            Sign in to your Desayner account
          </p>

          <FormFields
            email={email} setEmail={setEmail}
            password={password} setPassword={setPassword}
            showPw={showPw} setShowPw={setShowPw}
            rememberMe={rememberMe} setRememberMe={setRememberMe}
            loading={loading} error={error}
            handleLogin={handleLogin} handleGoogleLogin={handleGoogleLogin}
            setTurnstileToken={setTurnstileToken}
          />
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .login-video-panel { display: block !important; }
          .login-mobile-logo { display: none !important; }
        }
        @media (max-width: 767px) {
          .login-mobile-logo { display: block !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { 
          from { opacity: 0; transform: translateY(20px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        .login-form-container {
          animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .login-input {
          width: 100%;
          padding: 0.9rem 1rem;
          border-radius: 12px;
          border: 2px solid transparent;
          font-size: 0.95rem;
          color: #0f172a;
          background: #f1f5f9;
          box-sizing: border-box;
          outline: none;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .login-input:hover {
          background: #e2e8f0;
        }
        .login-input:focus { 
          border-color: #2d43e8 !important; 
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(45, 67, 232, 0.1);
        }
      `}</style>
    </div>
  );
}

// ── Shared form fields ────────────────────────────────────────────────────────
function FormFields({
  email, setEmail, password, setPassword,
  showPw, setShowPw, rememberMe, setRememberMe,
  loading, error, handleLogin, handleGoogleLogin, isModal, setTurnstileToken
}) {
  return (
    <>
      {/* Google button */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        style={{
          width: '100%',
          padding: '0.85rem',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          background: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.65rem',
          fontWeight: 600,
          fontSize: '0.9rem',
          color: '#231f20',
          transition: 'background 0.15s, border-color 0.15s',
          marginBottom: '1.5rem',
        }}
        onMouseOver={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
        onMouseOut={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
        <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>or with email</span>
        <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
      </div>

      {/* Email + password form */}
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
            />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#231f20' }}>Password</label>
            <Link href="/forgot-password" style={{ fontSize: '0.78rem', color: '#2d43e8', fontWeight: 600, textDecoration: 'none' }}>
              Forgot password?
            </Link>
          </div>
          <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                className="login-input"
                style={{ paddingRight: '3rem' }}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              style={{
                position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8',
                display: 'flex', alignItems: 'center', padding: 0,
              }}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Remember me */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none' }}>
          <div
            onClick={() => setRememberMe(!rememberMe)}
            style={{
              width: 17, height: 17, borderRadius: 4,
              border: rememberMe ? 'none' : '1px solid #cbd5e1',
              background: rememberMe ? '#2d43e8' : 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s', flexShrink: 0, cursor: 'pointer',
            }}
          >
            {rememberMe && <Check size={10} color="white" strokeWidth={3} />}
          </div>
          <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#475569' }}>Remember me</span>
        </label>

        <div style={{ margin: '0.25rem 0' }}>
          <Turnstile 
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} 
            onSuccess={(token) => setTurnstileToken(token)}
            options={{ size: 'flexible' }}
          />
        </div>

        {error && (
          <div style={{
            padding: '0.7rem 1rem', borderRadius: 8,
            background: '#fff1f1', border: '1px solid #fecaca',
            color: '#dc2626', fontSize: '0.85rem',
          }}>
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
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.85rem', color: '#64748b' }}>
        Don&apos;t have an account?{' '}
        <Link href="/signup" style={{ color: '#2d43e8', fontWeight: 700, textDecoration: 'none' }}>
          Sign up free
        </Link>
      </p>
    </>
  );
}
