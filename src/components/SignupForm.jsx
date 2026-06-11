'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff, Loader2, Check } from 'lucide-react';

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

  async function handleSignup(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Anti-bot honeypot check: If the hidden field is filled out, silently reject it
    if (botTrap) {
      // Fake success to fool the bot
      setSuccess(true);
      setLoading(false);
      return;
    }

    const supabase = createClient();
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
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  const pwStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const pwColors   = ['#e2e8f0', '#ef4444', '#f59e0b', '#22c55e'];
  const pwLabels   = ['', 'Weak', 'Fair', 'Strong'];

  if (success) return (
    <div style={{ minHeight: isModal ? 'auto' : '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isModal ? 'white' : '#fafafa', padding: '2rem', height: '100%', width: '100%' }}>
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#f0fdf4', border: '2px solid #22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <Check size={32} color="#22c55e" strokeWidth={2} />
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem' }}>Check your email!</h2>
        <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: '2rem' }}>
          We sent a confirmation link to <strong>{email}</strong>. Click the link to activate your Creldesk account.
        </p>
        <Link href="/login" replace={isModal} style={{ padding: '0.9rem 2rem', borderRadius: '12px', background: '#0f172a', color: 'white', fontWeight: 700, fontSize: '0.95rem', display: 'inline-block', textDecoration: 'none' }}>
          Back to Login
        </Link>
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: isModal ? 'auto' : '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: isModal ? 'white' : '#fafafa', padding: isModal ? '0' : '2rem',
      height: '100%', width: '100%'
    }}>
      <div style={{
        width: '100%', maxWidth: '420px', background: 'white',
        border: isModal ? 'none' : '1px solid #e8e8e8', borderRadius: isModal ? '0' : '24px',
        padding: isModal ? '2rem' : '2.5rem', boxShadow: isModal ? 'none' : '0 8px 40px rgba(0,0,0,0.06)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/desayner-logo.png" alt="Desayner" style={{ width: '200px', height: 'auto', display: 'block', margin: '0 auto' }} />
          <p style={{ marginTop: '1rem', color: '#64748b', fontSize: '0.95rem' }}>Create your account</p>
        </div>

        {/* Google OAuth */}
        <button
          onClick={handleGoogleLogin}
          style={{
            width: '100%', padding: '0.85rem', border: '1px solid #e2e8f0',
            borderRadius: '12px', background: 'white', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '0.75rem', fontWeight: 600, fontSize: '0.95rem',
            marginBottom: '1.5rem', transition: 'all 0.2s',
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
          Continue with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* HONEYPOT FIELD - Invisible to users, bots will fill this out */}
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
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Juan dela Cruz"
              required
              style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.95rem', background: '#f8fafc', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.95rem', background: '#f8fafc', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                required
                minLength={8}
                style={{ width: '100%', padding: '0.85rem 3rem 0.85rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.95rem', background: '#f8fafc', boxSizing: 'border-box', outline: 'none' }}
              />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                {showPw ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
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

          {error && (
            <div style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: '#fff1f1', border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.9rem', borderRadius: '12px', background: '#0f172a',
              color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '0.5rem', opacity: loading ? 0.7 : 1, marginTop: '0.5rem',
            }}
          >
            {loading && <Loader2 size={16} strokeWidth={1.5} style={{ animation: 'spin 1s linear infinite' }} />}
            {loading ? 'Creating account…' : 'Create Free Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#64748b' }}>
          Already have an account?{' '}
          <Link href="/login" replace={isModal} style={{ color: '#0009fa', fontWeight: 700 }}>Sign in</Link>
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
