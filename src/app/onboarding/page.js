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
  { id: 2, title: 'Creative Focus', desc: 'Bio & Specialties' },
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(at top left, #f8fafc 0%, #eff6ff 100%)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: -6, background: 'rgba(0, 9, 250, 0.15)', filter: 'blur(8px)', borderRadius: '50%' }} />
            <Loader2 size={40} color="#0009fa" style={{ animation: 'spin 1s linear infinite', position: 'relative' }} />
          </div>
          <p style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 700 }}>Loading setup wizard...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'radial-gradient(at top left, #f8fafc 0%, #eff6ff 100%)', fontFamily: 'var(--font-body)', position: 'relative' }}>
      
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 2rem', borderBottom: '1px solid rgba(226, 232, 240, 0.8)', background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(8px)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Image src="/Main_logo.png" alt="Desayner" width={120} height={28} style={{ width: '120px', height: 'auto' }} />
          <span style={{ height: '18px', width: '1px', background: '#cbd5e1' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>Creator Onboarding</span>
        </div>
        <button 
          onClick={handleSignOut}
          style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.8rem', fontWeight: 800, transition: 'opacity 0.2s' }}
          onMouseOver={e => e.currentTarget.style.opacity = '0.8'}
          onMouseOut={e => e.currentTarget.style.opacity = '1'}
        >
          <LogOut size={14} /> Log Out
        </button>
      </header>

      {/* Main Container */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem' }}>
        <div style={{ width: '100%', maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          
          {/* Step Indicators */}
          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', padding: '0 1rem' }}>
            {/* Background line */}
            <div style={{ position: 'absolute', top: '17px', left: '40px', right: '40px', height: '2px', background: '#e2e8f0', zIndex: 1 }} />
            {/* Active progress line */}
            <div style={{ 
              position: 'absolute', top: '17px', left: '40px', right: '40px', height: '2px', 
              background: '#0009fa', zIndex: 1,
              width: `${(step - 1) * 50}%`,
              transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }} />

            {STEPS.map((s, idx) => {
              const isActive = step === s.id;
              const isCompleted = step > s.id;
              return (
                <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, position: 'relative', width: '90px' }}>
                  <div style={{ 
                    width: '36px', height: '36px', borderRadius: '50%', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isCompleted ? '#0009fa' : isActive ? 'white' : '#f8fafc',
                    border: isActive ? '2.5px solid #0009fa' : isCompleted ? '2.5px solid #0009fa' : '2.5px solid #cbd5e1',
                    color: isCompleted ? 'white' : isActive ? '#0009fa' : '#64748b',
                    fontWeight: 800, fontSize: '0.85rem',
                    boxShadow: isActive ? '0 0 0 5px rgba(0, 9, 250, 0.12)' : 'none',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}>
                    {isCompleted ? <Check size={16} strokeWidth={3.5} /> : s.id}
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: isActive || isCompleted ? 800 : 600, color: isActive || isCompleted ? '#0f172a' : '#64748b', marginTop: '0.6rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Form Wizard Box */}
          <div style={{ background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(16px)', border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: '20px', padding: '2.5rem', boxShadow: '0 20px 40px -15px rgba(0, 9, 250, 0.04), 0 10px 20px -10px rgba(0, 0, 0, 0.02)' }}>
            <AnimatePresence mode="wait">
              
              {/* STEP 1: Photos and Branding */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}
                >
                  <div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '-0.02em' }}>
                      <Sparkles size={20} color="#0009fa" /> Create Your Studio Identity
                    </h2>
                    <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '0.35rem', lineHeight: 1.5 }}>
                      Desayner is a premium creator community. Uploading a **profile avatar** and a **cover banner** is required to build your portfolio.
                    </p>
                  </div>

                  {/* Profile Avatar Upload */}
                  <div style={{ border: '1px solid #f1f5f9', background: '#f8fafc', borderRadius: '12px', padding: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', marginBottom: '0.75rem' }}>
                      Profile Avatar *
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div style={{ border: '3px solid white', borderRadius: '50%', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                        <UserAvatar src={avatarUrl} name={fullName || username} size={80} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <ImageUpload 
                          label="" 
                          folder="avatars"
                          value={avatarUrl}
                          onUploaded={url => setAvatarUrl(url)}
                          onRemove={() => setAvatarUrl('')}
                          cropAspect={1}
                          cropShape="round"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cover Photo Upload */}
                  <div style={{ border: '1px solid #f1f5f9', background: '#f8fafc', borderRadius: '12px', padding: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', marginBottom: '0.75rem' }}>
                      Studio Cover Banner *
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {coverUrl ? (
                        <div style={{ width: '100%', aspectRatio: '3/1', background: '#f5f5f5', borderRadius: '10px', overflow: 'hidden', position: 'relative', border: '1px solid #cbd5e1' }}>
                          <img src={coverUrl} alt="Cover Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ) : (
                        <div style={{ width: '100%', aspectRatio: '3/1', background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', border: '1px dashed #cbd5e1', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.85rem' }}>
                          <ImageIcon size={28} color="#94a3b8" />
                          <span style={{ fontWeight: 600 }}>No cover banner uploaded</span>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Recommended: 1200 x 400 pixels (3:1)</span>
                        </div>
                      )}
                      <ImageUpload 
                        label="" 
                        folder="covers"
                        value={coverUrl}
                        onUploaded={url => setCoverUrl(url)}
                        onRemove={() => setCoverUrl('')}
                        cropAspect={3}
                        cropShape="rect"
                      />
                    </div>
                  </div>

                  {/* Text Fields */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', marginBottom: '0.45rem' }}>
                        Full Name *
                      </label>
                      <input 
                        type="text"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        placeholder="Juan dela Cruz"
                        className="premium-input"
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', marginBottom: '0.45rem' }}>
                        Username *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem', color: '#94a3b8', fontWeight: 700 }}>@</span>
                        <input 
                          type="text"
                          value={username}
                          onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                          placeholder="username"
                          className="premium-input"
                          style={{ paddingLeft: '2.1rem', borderColor: usernameError ? '#ef4444' : '#cbd5e1' }}
                        />
                        {checkingUsername && (
                          <Loader2 size={16} className="spin" style={{ position: 'absolute', right: '1.1rem', top: '50%', transform: 'translateY(-50%)', animation: 'spin 1s linear infinite' }} />
                        )}
                      </div>
                      {usernameError && (
                        <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.35rem', fontWeight: 600 }}>{usernameError}</p>
                      )}
                      {!usernameError && username.trim() && usernameAvailable && !checkingUsername && (
                        <p style={{ fontSize: '0.75rem', color: '#22c55e', marginTop: '0.35rem', fontWeight: 600 }}>✓ Username is available</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                    <button
                      onClick={nextStep}
                      disabled={!step1Valid}
                      className="premium-btn-dark"
                      style={{ 
                        opacity: step1Valid ? 1 : 0.45, 
                        cursor: step1Valid ? 'pointer' : 'not-allowed',
                        display: 'flex', alignItems: 'center', gap: '0.5rem'
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
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}
                >
                  <div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '-0.02em' }}>
                      <Briefcase size={20} color="#0009fa" /> Professional Survey
                    </h2>
                    <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '0.35rem', lineHeight: 1.5 }}>
                      Tell the community about your creative profile. Fill in your bio and select your primary creative tools to continue.
                    </p>
                  </div>

                  {/* Bio */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', marginBottom: '0.45rem' }}>
                      Professional Bio *
                    </label>
                    <textarea 
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                      placeholder="Write a short pitch about your creative fields, passions, and background (Min. 10 characters)..."
                      rows={4}
                      maxLength={280}
                      className="premium-textarea"
                    />
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginTop: '0.35rem', textAlign: 'right', fontWeight: 600 }}>
                      {bio.length}/280
                    </span>
                  </div>

                  {/* Tools / Creative Fields Multi-select */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', marginBottom: '0.6rem' }}>
                      Tools & Specialties (Select at least 1) *
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {CREATIVE_TOOLS.map(t => {
                        const isSelected = selectedTools.includes(t.id);
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleToolToggle(t.id)}
                            className="tool-tag"
                            style={{
                              display: 'flex', alignItems: 'center', gap: '0.45rem',
                              padding: '0.55rem 1.1rem', borderRadius: '24px',
                              border: isSelected ? '1.5px solid #0009fa' : '1px solid #cbd5e1',
                              background: isSelected ? 'linear-gradient(135deg, #eef0ff 0%, #e0e4ff 100%)' : 'white',
                              color: isSelected ? '#0009fa' : '#475569',
                              fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              boxShadow: isSelected ? '0 4px 12px rgba(0, 9, 250, 0.1)' : 'none',
                              transform: isSelected ? 'scale(1.02)' : 'none'
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
                  <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '220px' }}>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', marginBottom: '0.45rem' }}>
                        Location
                      </label>
                      <div style={{ position: 'relative' }}>
                        <MapPin size={16} style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input 
                          type="text"
                          value={location}
                          onChange={e => setLocation(e.target.value)}
                          placeholder="Manila, Philippines"
                          className="premium-input"
                          style={{ paddingLeft: '2.5rem' }}
                        />
                      </div>
                    </div>

                    <div style={{ flex: 1, minWidth: '220px' }}>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', marginBottom: '0.45rem' }}>
                        Website URL
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Globe size={16} style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input 
                          type="url"
                          value={website}
                          onChange={e => setWebsite(e.target.value)}
                          placeholder="https://juan.design"
                          className="premium-input"
                          style={{ paddingLeft: '2.5rem' }}
                        />
                      </div>
                    </div>
                  </div>

                  {submitError && (
                    <div style={{ padding: '0.85rem 1.1rem', background: '#fff1f2', border: '1px solid #ffe4e6', color: '#e11d48', fontSize: '0.85rem', borderRadius: '10px', fontWeight: 600 }}>
                      {submitError}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', gap: '1rem' }}>
                    <button
                      onClick={() => setStep(1)}
                      className="premium-btn-outline"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <ChevronLeft size={16} /> Back
                    </button>
                    <button
                      onClick={handleFinish}
                      disabled={!step2Valid || submitting}
                      className="premium-btn-dark"
                      style={{ 
                        opacity: step2Valid && !submitting ? 1 : 0.45, 
                        cursor: step2Valid && !submitting ? 'pointer' : 'not-allowed',
                        display: 'flex', alignItems: 'center', gap: '0.5rem'
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
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '2rem', padding: '1.5rem 0' }}
                >
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: -8, background: 'rgba(34, 197, 94, 0.2)', filter: 'blur(12px)', borderRadius: '50%', zIndex: 0 }} />
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#f0fdf4', border: '2px solid #22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
                      <Check size={40} color="#22c55e" strokeWidth={3.5} />
                    </div>
                  </div>

                  <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>You are all set, {fullName.split(' ')[0]}!</h2>
                    <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.5rem', maxWidth: '420px', lineHeight: 1.65 }}>
                      Your studio cover and details look clean and highly professional. You are ready to explore projects, follow creators, and share your work.
                    </p>
                  </div>

                  {/* Profile Preview Card */}
                  <div style={{ width: '100%', maxWidth: '360px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0, 9, 250, 0.03)' }}>
                    <div style={{ width: '100%', height: '100px', background: '#f1f5f9', position: 'relative' }}>
                      {coverUrl ? <img src={coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                    </div>
                    <div style={{ padding: '0 1.25rem 1.25rem 1.25rem', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '-36px' }}>
                      <div style={{ border: '3px solid white', borderRadius: '50%', overflow: 'hidden', background: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                        <UserAvatar src={avatarUrl} name={fullName} size={72} />
                      </div>
                      <h4 style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a', marginTop: '0.5rem' }}>{fullName}</h4>
                      <p style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>@{username}</p>
                      
                      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.75rem' }}>
                        {selectedTools.slice(0, 3).map(toolId => {
                          const tool = CREATIVE_TOOLS.find(t => t.id === toolId);
                          return tool ? (
                            <span key={toolId} style={{ fontSize: '0.68rem', padding: '3px 8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#475569', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                              <img src={tool.iconPath} alt="" style={{ width: '12px', height: '12px', objectFit: 'contain' }} />
                              {tool.name}
                            </span>
                          ) : null;
                        })}
                        {selectedTools.length > 3 && (
                          <span style={{ fontSize: '0.68rem', padding: '3px 8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#64748b', fontWeight: 600 }}>
                            +{selectedTools.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      window.location.href = '/';
                    }}
                    className="premium-btn-primary"
                    style={{ 
                      width: '100%', maxWidth: '240px', justifyContent: 'center',
                      padding: '0.85rem', borderRadius: '10px', background: '#0009fa', borderColor: '#0009fa',
                      display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 10px 20px -8px rgba(0, 9, 250, 0.3)',
                      cursor: 'pointer'
                    }}
                  >
                    Launch My Studio <ChevronRight size={16} />
                  </button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Premium CSS Styles */}
      <style>{`
        @keyframes spin { 
          from { transform: translateY(-50%) rotate(0deg); }
          to { transform: translateY(-50%) rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite !important;
        }

        .premium-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.9rem;
          outline: none;
          background: white;
          color: #0f172a;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .premium-input:focus {
          border-color: #0009fa;
          box-shadow: 0 0 0 4px rgba(0, 9, 250, 0.1);
        }

        .premium-textarea {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.9rem;
          outline: none;
          background: white;
          color: #0f172a;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          line-height: 1.5;
        }
        .premium-textarea:focus {
          border-color: #0009fa;
          box-shadow: 0 0 0 4px rgba(0, 9, 250, 0.1);
        }

        .premium-btn-dark {
          background: #0f172a;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .premium-btn-dark:hover:not(:disabled) {
          background: #000000;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .premium-btn-outline {
          background: white;
          color: #0f172a;
          border: 1px solid #cbd5e1;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .premium-btn-outline:hover {
          background: #f8fafc;
          border-color: #94a3b8;
        }

        .premium-btn-primary {
          background: #0009fa;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .premium-btn-primary:hover {
          background: #0007c6;
          transform: translateY(-1px);
        }

        .tool-tag:hover {
          border-color: #0009fa !important;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}
