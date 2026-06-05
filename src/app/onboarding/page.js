'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ImageUpload from '@/components/ImageUpload';
import UserAvatar from '@/components/UserAvatar';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Image as ImageIcon, ChevronRight, ChevronLeft, Check, 
  Loader2, Briefcase, MapPin, Globe, Sparkles, LogOut
} from 'lucide-react';
import { CREATIVE_TOOLS } from '@/lib/constants';

const STEPS = [
  { id: 1, title: 'Your Brand', desc: 'Photos & Identity' },
  { id: 2, title: 'Your Creative Focus', desc: 'Bio & Specialties' },
  { id: 3, title: 'Welcome', desc: 'Setup Complete' }
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loadingUser, setLoadingUser] = useState(true);
  const [userId, setUserId] = useState(null);
  const [profile, setProfile] = useState(null);

  // Step state
  const [step, setStep] = useState(1);

  // Form states
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [selectedTools, setSelectedTools] = useState([]);

  // Username validation state
  const [usernameAvailable, setUsernameAvailable] = useState(true);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState('');

  // Form submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // 1. Initial auth & profile load
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Guests cannot access onboarding -> go to login
        router.replace('/login');
        return;
      }
      setUserId(user.id);

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (prof) {
        setProfile(prof);
        setFullName(prof.full_name || '');
        // Default username from full_name if not already set
        const defaultUname = prof.username || (prof.full_name ? prof.full_name.toLowerCase().replace(/[^a-z0-9]/g, '') : '');
        setUsername(defaultUname);
        setAvatarUrl(prof.avatar_url || '');
        setCoverUrl(prof.cover_url || '');
        setBio(prof.bio || '');
        setLocation(prof.location || '');
        setWebsite(prof.website || '');
        setSelectedTools(prof.tools || []);

        // If they already have both profile photo & cover photo uploaded, redirect them to dashboard
        if (prof.avatar_url && prof.cover_url) {
          router.replace('/');
          return;
        }
      }
      setLoadingUser(false);
    }
    load();
  }, [router, supabase]);

  // 2. Validate username on typing (debounced lookups)
  useEffect(() => {
    if (!username.trim() || username === profile?.username) {
      setUsernameAvailable(true);
      setCheckingUsername(false);
      setUsernameError('');
      return;
    }

    if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      setUsernameAvailable(false);
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

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  // Handle step navigations
  function nextStep() {
    if (step === 1) {
      if (!avatarUrl) return;
      if (!coverUrl) return;
      if (!fullName.trim()) return;
      if (!username.trim() || !usernameAvailable) return;
    }
    setStep(s => s + 1);
  }

  function prevStep() {
    setStep(s => s - 1);
  }

  // Save profile and finish onboarding
  async function handleFinish() {
    setSubmitting(true);
    setSubmitError('');

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        username: username.trim().toLowerCase(),
        avatar_url: avatarUrl,
        cover_url: coverUrl,
        bio: bio.trim(),
        location: location.trim() || null,
        website: website.trim() || null,
        tools: selectedTools,
      })
      .eq('id', userId);

    if (error) {
      setSubmitError(error.message);
      setSubmitting(false);
    } else {
      setStep(3);
      setSubmitting(false);
    }
  }

  function handleToolToggle(toolId) {
    setSelectedTools(prev => 
      prev.includes(toolId) ? prev.filter(id => id !== toolId) : [...prev, toolId]
    );
  }

  // Check if current step forms are complete
  const step1Valid = avatarUrl && coverUrl && fullName.trim() && username.trim() && usernameAvailable && !checkingUsername && !usernameError;
  const step2Valid = bio.trim().length >= 10 && selectedTools.length > 0;

  if (loadingUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <Loader2 size={36} color="#0009fa" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>Loading setup wizard...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc', fontFamily: 'var(--font-body)', position: 'relative' }}>
      
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 2rem', borderBottom: '1px solid #e2e8f0', background: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Image src="/Main_logo.png" alt="Desayner" width={120} height={28} style={{ width: '120px', height: 'auto' }} />
          <span style={{ height: '18px', width: '1px', background: '#cbd5e1' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>Creator Onboarding</span>
        </div>
        <button 
          onClick={handleSignOut}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.8rem', fontWeight: 700 }}
        >
          <LogOut size={14} /> Log Out
        </button>
      </header>

      {/* Main Container */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div style={{ width: '100%', maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Step Indicators */}
          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', padding: '0 0.5rem' }}>
            {/* Background line */}
            <div style={{ position: 'absolute', top: '16px', left: '32px', right: '32px', height: '2px', background: '#e2e8f0', zIndex: 1 }} />
            {/* Active progress line */}
            <div style={{ 
              position: 'absolute', top: '16px', left: '32px', right: '32px', height: '2px', 
              background: '#0009fa', zIndex: 1,
              width: `${(step - 1) * 50}%`,
              transition: 'width 0.3s ease'
            }} />

            {STEPS.map((s, idx) => {
              const isActive = step === s.id;
              const isCompleted = step > s.id;
              return (
                <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, position: 'relative', width: '80px' }}>
                  <div style={{ 
                    width: '34px', height: '34px', borderRadius: '50%', 
                    display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center',
                    background: isCompleted ? '#0009fa' : isActive ? 'white' : '#f1f5f9',
                    border: isActive ? '2px solid #0009fa' : isCompleted ? '2px solid #0009fa' : '2px solid #e2e8f0',
                    color: isCompleted ? 'white' : isActive ? '#0009fa' : '#64748b',
                    fontWeight: 700, fontSize: '0.85rem',
                    transition: 'all 0.3s'
                  }}>
                    {isCompleted ? <Check size={16} strokeWidth={3} /> : s.id}
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: isActive || isCompleted ? 700 : 500, color: isActive || isCompleted ? '#0f172a' : '#64748b', marginTop: '0.5rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Form Wizard Box */}
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2.5rem', boxShadow: '0 4px 24px rgba(0,0,0,0.02)' }}>
            <AnimatePresence mode="wait">
              
              {/* STEP 1: Photos and Branding */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
                >
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Sparkles size={20} color="#0009fa" /> Create Your Studio Identity
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                      Desayner is a premium showcase. Uploading a profile photo and cover photo is **required** to proceed.
                    </p>
                  </div>

                  {/* Profile Avatar Upload */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b6b6b', marginBottom: '0.5rem' }}>
                      Profile Avatar *
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <UserAvatar src={avatarUrl} name={fullName || username} size={80} />
                      <div style={{ flex: 1 }}>
                        <ImageUpload 
                          label="" 
                          folder="avatars"
                          value={avatarUrl}
                          onUploaded={url => setAvatarUrl(url)}
                          onRemove={() => setAvatarUrl('')}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cover Photo Upload */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b6b6b', marginBottom: '0.5rem' }}>
                      Studio Cover Banner *
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {coverUrl ? (
                        <div style={{ width: '100%', aspectRatio: '3/1', background: '#f5f5f5', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                          <img src={coverUrl} alt="Cover Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ) : (
                        <div style={{ width: '100%', aspectRatio: '3/1', background: '#fafafa', border: '1px dashed #cbd5e1', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                          Upload cover image (Recommended: 1200 x 400 pixels)
                        </div>
                      )}
                      <ImageUpload 
                        label="" 
                        folder="covers"
                        value={coverUrl}
                        onUploaded={url => setCoverUrl(url)}
                        onRemove={() => setCoverUrl('')}
                      />
                    </div>
                  </div>

                  {/* Text Fields */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b6b6b', marginBottom: '0.4rem' }}>
                        Full Name *
                      </label>
                      <input 
                        type="text"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        placeholder="Juan dela Cruz"
                        style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b6b6b', marginBottom: '0.4rem' }}>
                        Username *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>@</span>
                        <input 
                          type="text"
                          value={username}
                          onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                          placeholder="username"
                          style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2rem', border: `1px solid ${usernameError ? '#ef4444' : '#cbd5e1'}`, borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                        />
                        {checkingUsername && (
                          <Loader2 size={16} className="spin" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', animation: 'spin 1s linear infinite' }} />
                        )}
                      </div>
                      {usernameError && (
                        <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>{usernameError}</p>
                      )}
                      {!usernameError && username.trim() && usernameAvailable && !checkingUsername && (
                        <p style={{ fontSize: '0.75rem', color: '#22c55e', marginTop: '0.25rem' }}>✓ Username is available</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button
                      onClick={nextStep}
                      disabled={!step1Valid}
                      className="btn btn-dark"
                      style={{ 
                        opacity: step1Valid ? 1 : 0.4, 
                        cursor: step1Valid ? 'pointer' : 'not-allowed',
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.75rem 1.5rem', borderRadius: '8px'
                      }}
                    >
                      Continue Setup <ChevronRight size={16} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Creative Background & Survey */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
                >
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Briefcase size={20} color="#0009fa" /> Professional Survey
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                      Tell us about your creative skills. You must fill out your bio and select at least one creative tool to finish.
                    </p>
                  </div>

                  {/* Bio */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b6b6b', marginBottom: '0.4rem' }}>
                      Professional Bio *
                    </label>
                    <textarea 
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                      placeholder="Write a short pitch about your creative fields, passions, and background (Min. 10 characters)..."
                      rows={4}
                      maxLength={280}
                      style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', resize: 'vertical', lineHeight: 1.5 }}
                    />
                    <span style={{ fontSize: '0.72rem', color: '#9b9b9b', display: 'block', marginTop: '0.25rem', textAlign: 'right' }}>
                      {bio.length}/280
                    </span>
                  </div>

                  {/* Tools / Creative Fields Multi-select */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b6b6b', marginBottom: '0.5rem' }}>
                      Tools & specialties (Select at least 1) *
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {CREATIVE_TOOLS.map(t => {
                        const isSelected = selectedTools.includes(t.id);
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleToolToggle(t.id)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '0.4rem',
                              padding: '0.4rem 0.8rem', borderRadius: '20px',
                              border: isSelected ? '1px solid #0009fa' : '1px solid #cbd5e1',
                              background: isSelected ? '#eef0ff' : 'white',
                              color: isSelected ? '#0009fa' : '#0a0a0a',
                              fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                              transition: 'all 0.15s'
                            }}
                          >
                            <img src={t.iconPath} alt={t.name} style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
                            {t.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Additional info */}
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b6b6b', marginBottom: '0.4rem' }}>
                        Location
                      </label>
                      <div style={{ position: 'relative' }}>
                        <MapPin size={15} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input 
                          type="text"
                          value={location}
                          onChange={e => setLocation(e.target.value)}
                          placeholder="Manila, Philippines"
                          style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                        />
                      </div>
                    </div>

                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b6b6b', marginBottom: '0.4rem' }}>
                        Website URL
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Globe size={15} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input 
                          type="url"
                          value={website}
                          onChange={e => setWebsite(e.target.value)}
                          placeholder="https://juan.design"
                          style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                        />
                      </div>
                    </div>
                  </div>

                  {submitError && (
                    <div style={{ padding: '0.75rem 1rem', background: '#fff0f0', border: '1px solid #ffd0d0', color: '#ff3b3b', fontSize: '0.85rem', borderRadius: '8px' }}>
                      {submitError}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                    <button
                      onClick={prevStep}
                      className="btn btn-outline"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '8px' }}
                    >
                      <ChevronLeft size={16} /> Back
                    </button>
                    <button
                      onClick={handleFinish}
                      disabled={!step2Valid || submitting}
                      className="btn btn-dark"
                      style={{ 
                        opacity: step2Valid && !submitting ? 1 : 0.4, 
                        cursor: step2Valid && !submitting ? 'pointer' : 'not-allowed',
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.75rem 1.5rem', borderRadius: '8px'
                      }}
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> Processing...
                        </>
                      ) : (
                        <>
                          Complete Setup <Check size={16} />
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Complete & Celebrate */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1.5rem', padding: '1.5rem 0' }}
                >
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#f0fdf4', border: '2px solid #22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={40} color="#22c55e" strokeWidth={3} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>You are all set, {fullName.split(' ')[0]}!</h2>
                    <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.5rem', maxWidth: '400px', lineHeight: 1.6 }}>
                      Your studio cover and details look clean and highly professional. You are ready to explore projects, follow creators, and share your work.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      // Redirect to main app dashboard
                      window.location.href = '/';
                    }}
                    className="btn btn-primary"
                    style={{ 
                      width: '100%', maxWidth: '240px', justifyContent: 'center',
                      padding: '0.85rem', borderRadius: '8px', background: '#0009fa', borderColor: '#0009fa'
                    }}
                  >
                    Launch My Studio
                  </button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Styles for animation */}
      <style>{`
        @keyframes spin { 
          from { transform: translateY(-50%) rotate(0deg); }
          to { transform: translateY(-50%) rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite !important;
        }
      `}</style>
    </div>
  );
}
