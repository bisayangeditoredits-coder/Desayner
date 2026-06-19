'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff, Loader2, Check } from 'lucide-react';
import FeatureShowcase from '@/components/marketing/FeatureShowcase';
import { Turnstile } from '@marsidev/react-turnstile';

import { checkAuthRateLimit } from '@/app/actions/authRateLimit';

export default function SignupForm({ isModal = false }) {
  const router = useRouter();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);
  const [botTrap, setBotTrap]   = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');

  // Stable Supabase client
  const supabase = useMemo(() => createClient(), []);

  async function handleSignup(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (botTrap) {
      setSuccess(true);
      setLoading(false);
      return;
    }

    if (!turnstileToken) {
      setError('Please verify that you are human.');
      setLoading(false);
      return;
    }

    // Rate Limiting Check
    try {
      const rateLimitRes = await checkAuthRateLimit();
      if (!rateLimitRes.success) {
        setError(rateLimitRes.message);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error('Rate limit error:', err);
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  const pwStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const pwColors   = ['#e2e8f0', '#ef4444', '#f59e0b', '#22c55e'];
  const pwLabels   = ['', 'Weak', 'Fair', 'Strong'];

  // ── Success State ───────────────────────────────────────────────────────────
  if (success) {
    return (
      <div style={{
        minHeight: isModal ? 'auto' : '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: isModal ? 'white' : '#fafafa',
        padding: '2rem', height: '100%', width: '100%'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#f0fdf4', border: '2px solid #22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Check size={32} color="#22c55e" strokeWidth={2} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem' }}>Check your email!</h2>
          <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: '2rem' }}>
            We sent a confirmation link to <strong>{email}</strong>. Click the link to activate your Desayner account.
          </p>
          <Link href="/login" replace={isModal} style={{ padding: '0.9rem 2rem', borderRadius: '12px', background: '#231f20', color: 'white', fontWeight: 700, fontSize: '0.95rem', display: 'inline-block', textDecoration: 'none' }}>
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  // ── Modal layout (compact version) ──────────────────────────────────────────
  if (isModal) {
    return (
      <div style={{ padding: '2rem', fontFamily: '"Inter", "Segoe UI", sans-serif' }}>
        <div style={{ width: '100%', maxWidth: 400, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <img src="/desayner-logo.png" alt="Desayner" style={{ width: 160, height: 'auto' }} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#231f20', marginBottom: '0.4rem', letterSpacing: '-0.03em', textAlign: 'center' }}>
            Create an account
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.75rem', textAlign: 'center' }}>
            Join the network of creators
          </p>
          <FormFields
            fullName={fullName} setFullName={setFullName}
            email={email} setEmail={setEmail}
            password={password} setPassword={setPassword}
            showPw={showPw} setShowPw={setShowPw}
            loading={loading} error={error} botTrap={botTrap} setBotTrap={setBotTrap}
            handleSignup={handleSignup} handleGoogleLogin={handleGoogleLogin}
            pwStrength={pwStrength} pwColors={pwColors} pwLabels={pwLabels}
            setTurnstileToken={setTurnstileToken}
            isModal
          />
        </div>
      </div>
    );
  }

  // ── Full-page split layout ──────────────────────────────────────────────────
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
              color: 'rgba(255,255,255,0.55)',
              marginBottom: '0.6rem',
            }}>
              Join the Community
            </p>
            <h2 style={{
              fontSize: 'clamp(1.6rem, 3vw, 2.4rem)',
              fontWeight: 900,
              color: 'white',
              lineHeight: 1.2,
              letterSpacing: '-0.03em',
              marginBottom: '0.75rem',
            }}>
              Your portfolio,<br />reimagined.
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
              Connect with designers, share your best work,<br />and land your next big gig.
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

          {/* Logo — shown only when video panel is hidden (mobile) */}
          <div className="login-mobile-logo" style={{ marginBottom: '2rem', display: 'none' }}>
            <img src="/desayner-logo.png" alt="Desayner" style={{ width: 160, height: 'auto' }} />
          </div>

          <h1 style={{
            fontSize: '1.85rem',
            fontWeight: 900,
            color: '#231f20',
            marginBottom: '0.4rem',
            letterSpacing: '-0.03em',
          }}>
            Create an account
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '2rem' }}>
            Join the network of creators
          </p>

          <FormFields
            fullName={fullName} setFullName={setFullName}
            email={email} setEmail={setEmail}
            password={password} setPassword={setPassword}
            showPw={showPw} setShowPw={setShowPw}
            loading={loading} error={error} botTrap={botTrap} setBotTrap={setBotTrap}
            handleSignup={handleSignup} handleGoogleLogin={handleGoogleLogin}
            pwStrength={pwStrength} pwColors={pwColors} pwLabels={pwLabels}
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

import { Lock } from 'lucide-react';

// ── Shared form fields ────────────────────────────────────────────────────────
function FormFields({
  fullName, setFullName, email, setEmail, password, setPassword,
  showPw, setShowPw, loading, error, botTrap, setBotTrap,
  handleSignup, handleGoogleLogin, pwStrength, pwColors, pwLabels, isModal,
  setTurnstileToken
}) {
  const [agreed, setAgreed] = useState(false);

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
        Sign up with Google
      </button>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
        <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>or with email</span>
        <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
      </div>

      {/* Email + password form */}
      <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* HONEYPOT FIELD */}
        <div style={{ position: 'absolute', left: '-9999px', opacity: 0 }} aria-hidden="true">
          <label htmlFor="website_url">Website URL</label>
          <input 
            type="text" 
            id="website_url" 
            name="website_url" 
            tabIndex={-1} 
            autoComplete="off"
            value={botTrap}
            onChange={e => setBotTrap(e.target.value)}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#231f20', marginBottom: '0.5rem' }}>
            Full Name
          </label>
          <input
            type="text"
            className="login-input"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Juan dela Cruz"
            required
          />
        </div>

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
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#231f20', marginBottom: '0.5rem' }}>
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPw ? 'text' : 'password'}
              className="login-input"
              style={{ paddingRight: '3rem' }}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              required
              minLength={8}
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
          {/* Password strength bar */}
          {password && (
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                {[1,2,3].map(i => (
                  <div key={i} style={{ flex: 1, height: '3px', borderRadius: '99px', background: i <= pwStrength ? pwColors[pwStrength] : '#e2e8f0', transition: 'background 0.3s' }} />
                ))}
              </div>
              <span style={{ fontSize: '0.75rem', color: pwColors[pwStrength], fontWeight: 600 }}>{pwLabels[pwStrength]}</span>
            </div>
          )}
        </div>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginTop: '0.25rem', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            style={{ marginTop: '0.15rem', accentColor: '#2d43e8', width: '16px', height: '16px' }}
          />
          <span style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.5 }}>
            I agree to the <Link href="/terms" style={{ color: '#2d43e8', fontWeight: 600, textDecoration: 'none' }}>Terms of Service</Link> and <Link href="/privacy" style={{ color: '#2d43e8', fontWeight: 600, textDecoration: 'none' }}>Privacy Policy</Link>.
          </span>
        </label>

        <div style={{ margin: '0.25rem 0' }}>
          <Turnstile 
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '0x4AAAAAADmfKEKIUNe6N_Yn'} 
            onSuccess={(token) => setTurnstileToken(token)}
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
          disabled={loading || !agreed}
          style={{
            width: '100%', padding: '0.9rem', borderRadius: 8,
            background: '#231f20', color: 'white', border: 'none',
            cursor: (loading || !agreed) ? 'not-allowed' : 'pointer', fontWeight: 700,
            fontSize: '0.9rem', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '0.5rem',
            opacity: (loading || !agreed) ? 0.6 : 1, transition: 'opacity 0.2s, background 0.2s',
            marginTop: '0.5rem',
          }}
          onMouseOver={e => (!loading && agreed) && (e.currentTarget.style.background = '#2d43e8')}
          onMouseOut={e => (!loading && agreed) && (e.currentTarget.style.background = '#231f20')}
        >
          {loading && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />}
          {loading ? 'Creating account…' : 'Create Free Account'}
        </button>

        {/* Security / Trust Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginTop: '0.5rem' }}>
          <Lock size={14} color="#059669" />
          <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, letterSpacing: '0.02em' }}>
            Secured with AES-256 Encryption
          </span>
        </div>
      </form>

      <p style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.85rem', color: '#64748b' }}>
        Already have an account?{' '}
        <Link href="/login" replace={isModal} style={{ color: '#2d43e8', fontWeight: 700, textDecoration: 'none' }}>
          Sign in
        </Link>
      </p>
    </>
  );
}
