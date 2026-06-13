'use client';

import { useState, useEffect, useMemo} from 'react';
import { createClient } from '@/lib/supabase/client';
import ImageUpload from '@/components/ImageUpload';
import UserAvatar from '@/components/UserAvatar';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowRight, User } from 'lucide-react';
import { CREATIVE_TOOLS } from '@/lib/constants';
import { saveProfileAdmin } from '@/app/actions/onboardingActions';

export default function OnboardingModal({ user, onComplete }) {
  const supabase = useMemo(() => createClient(), []);

  const [loadingUser, setLoadingUser] = useState(true);
  const [profile, setProfile] = useState(null);

  // Step state (1: Basic Info, 2: Bio & Tools)
  const [step, setStep] = useState(1);

  // Form states
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [selectedTools, setSelectedTools] = useState([]);

  // Username validation state
  const [usernameAvailable, setUsernameAvailable] = useState(true);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState('');

  // Form submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // 1. Initial profile load
  useEffect(() => {
    async function load() {
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (prof) {
        setProfile(prof);
        setFullName(prof.full_name || '');
        const defaultUname = prof.username || (prof.full_name ? prof.full_name.toLowerCase().replace(/[^a-z0-9]/g, '') : '');
        setUsername(defaultUname);
        setAvatarUrl(prof.avatar_url || '');
        setBio(prof.bio || '');
        setSelectedTools(prof.tools || []);
      }
      setLoadingUser(false);
    }
    load();
  }, [user.id, supabase]);

  // 2. Validate username on typing
  useEffect(() => {
    if (!username.trim() || username === profile?.username) {
      setTimeout(() => {
        setUsernameAvailable(true);
        setCheckingUsername(false);
        setUsernameError('');
      }, 0);
      return;
    }

    if (username.length < 3) {
      setTimeout(() => {
        setUsernameError('Username must be at least 3 characters');
        setUsernameAvailable(false);
      }, 0);
      return;
    }

    const t = setTimeout(async () => {
      setCheckingUsername(true);
      setUsernameError('');
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.trim().toLowerCase())
        .maybeSingle();

      setCheckingUsername(false);
      if (data) {
        setUsernameAvailable(false);
        setUsernameError('Username is already taken');
      } else {
        setUsernameAvailable(true);
      }
    }, 500);

    return () => clearTimeout(t);
  }, [username, profile, supabase]);

  function handleToolToggle(toolId) {
    setSelectedTools(prev => 
      prev.includes(toolId) ? prev.filter(id => id !== toolId) : [...prev, toolId]
    );
  }

  // Handle step navigations
  function nextStep() {
    if (step === 1) {
      if (!avatarUrl) return;
      if (!fullName.trim()) return;
      if (!username.trim() || !usernameAvailable) return;
      setStep(2);
    } else if (step === 2) {
      handleFinish();
    }
  }

  // Save profile and finish onboarding
  async function handleFinish() {
    if (!bio.trim() || selectedTools.length === 0) return;
    setSubmitting(true);
    setSubmitError('');

    const res = await saveProfileAdmin({
      id: user.id,
      full_name: fullName.trim(),
      username: username.trim().toLowerCase(),
      avatar_url: avatarUrl,
      bio: bio.trim(),
      tools: selectedTools
    });

    if (!res.success) {
      setSubmitError(res.error);
      setSubmitting(false);
    } else {
      // Call the onComplete callback to instantly hide the modal!
      onComplete();
    }
  }

  const step1Valid = avatarUrl && fullName.trim() && username.trim() && usernameAvailable && !checkingUsername && !usernameError;
  const step2Valid = bio.trim().length >= 10 && selectedTools.length > 0;

  if (loadingUser) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
        <Loader2 size={32} color="#2d43e8" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{ 
        background: '#ffffff', 
        width: '100%', 
        maxWidth: '520px', 
        borderRadius: '24px', 
        boxShadow: '0 20px 40px -15px rgba(45, 67, 232, 0.08), 0 10px 20px -10px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* Top Gradient Accent */}
      <div style={{ height: '8px', background: 'linear-gradient(90deg, #2d43e8 0%, #3b82f6 100%)' }} />

      <div style={{ padding: '2.5rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/desayner-logo.png" alt="Desayner" style={{ width: '48px', height: 'auto', margin: '0 auto 1rem', display: 'block' }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Welcome to Desayner</h1>
          <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.5rem' }}>
            {step === 1 ? 'Let’s set up your creator identity.' : 'Tell us about your creative focus.'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1 */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
            >
              {/* Avatar Upload */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #f1f5f9' }}>
                  <UserAvatar src={avatarUrl} name={fullName || username} size={80} />
                </div>
                <ImageUpload 
                  label="Upload Avatar" 
                  folder="avatars"
                  value={avatarUrl}
                  onUploaded={url => setAvatarUrl(url)}
                  onRemove={() => setAvatarUrl('')}
                  cropAspect={1}
                  cropShape="round"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>Full Name</label>
                <input 
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Juan dela Cruz"
                  style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#2d43e8'}
                  onBlur={e => e.target.style.borderColor = '#cbd5e1'}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>Username</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontWeight: 600 }}>@</span>
                  <input 
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="username"
                    style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.2rem', borderRadius: '12px', border: `1px solid ${usernameError ? '#ef4444' : '#cbd5e1'}`, fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = usernameError ? '#ef4444' : '#2d43e8'}
                    onBlur={e => e.target.style.borderColor = usernameError ? '#ef4444' : '#cbd5e1'}
                  />
                  {checkingUsername && (
                    <Loader2 size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', animation: 'spin 1s linear infinite', color: '#94a3b8' }} />
                  )}
                </div>
                {usernameError && <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.35rem', fontWeight: 600 }}>{usernameError}</p>}
              </div>

              <button
                onClick={nextStep}
                disabled={!step1Valid}
                style={{ 
                  marginTop: '1rem', width: '100%', padding: '0.9rem', background: step1Valid ? '#2d43e8' : '#cbd5e1', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '0.95rem', cursor: step1Valid ? 'pointer' : 'not-allowed', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                }}
              >
                Continue <ArrowRight size={16} />
              </button>
            </motion.div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>Professional Bio</label>
                <textarea 
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Short pitch about your creative fields, passions, and background..."
                  rows={3}
                  maxLength={150}
                  style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', resize: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#2d43e8'}
                  onBlur={e => e.target.style.borderColor = '#cbd5e1'}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.6rem' }}>Tools & Specialties</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {CREATIVE_TOOLS.map(t => {
                    const isSelected = selectedTools.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        onClick={() => handleToolToggle(t.id)}
                        style={{
                          padding: '0.4rem 0.8rem',
                          borderRadius: '20px',
                          border: isSelected ? '1px solid #2d43e8' : '1px solid #e2e8f0',
                          background: isSelected ? 'rgba(45, 67, 232, 0.05)' : 'white',
                          color: isSelected ? '#2d43e8' : '#64748b',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}
                      >
                        <img src={t.iconPath} alt={t.name} style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
                        {t.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {submitError && <p style={{ fontSize: '0.8rem', color: '#ef4444', textAlign: 'center', fontWeight: 600 }}>{submitError}</p>}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  onClick={() => setStep(1)}
                  style={{ padding: '0.9rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s', flex: 1 }}
                >
                  Back
                </button>
                <button
                  onClick={nextStep}
                  disabled={!step2Valid || submitting}
                  style={{ padding: '0.9rem', background: step2Valid ? '#2d43e8' : '#cbd5e1', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '0.95rem', cursor: step2Valid && !submitting ? 'pointer' : 'not-allowed', transition: 'all 0.2s', flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  {submitting ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : 'Complete Profile'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
}
