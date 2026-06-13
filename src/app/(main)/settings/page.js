'use client';
import { useState, useEffect, useMemo} from 'react';
import { createClient } from '@/lib/supabase/client';
import UserAvatar from '@/components/UserAvatar';
import ImageUpload from '@/components/ImageUpload';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Save, User, Lock, Trash2, ArrowLeft } from 'lucide-react';
import { CREATIVE_TOOLS } from '@/lib/constants';
import '../../App.css';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'account', label: 'Account', icon: Lock },
];

const inputStyle = {
  width: '100%', padding: '0.65rem 0.9rem',
  border: '1px solid #e8e8e8', background: 'white',
  fontSize: '0.875rem', outline: 'none',
  fontFamily: 'inherit', color: '#231f20',
  transition: 'border-color 0.15s',
};
const labelStyle = {
  display: 'block', fontSize: '0.72rem', fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.06em',
  color: '#6b6b6b', marginBottom: '0.4rem',
};

export default function SettingsPage() {
  const [tab, setTab]         = useState('profile');
  const [profile, setProfile] = useState(null);
  const [form, setForm]       = useState({ full_name: '', username: '', bio: '', website: '', location: '', tools: [] });
  const [avatarUrl, setAvatarUrl] = useState('');
  const [coverUrl, setCoverUrl]   = useState('');
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState('');
  const [newEmail, setNewEmail]   = useState('');
  const [newPass, setNewPass]     = useState('');
  const [authSaving, setAuthSaving] = useState(false);
  const [authMsg, setAuthMsg]   = useState('');
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setProfile(data);
        setForm({
          full_name: data.full_name || '',
          username:  data.username  || '',
          bio:       data.bio       || '',
          website:   data.website   || '',
          location:  data.location  || '',
          tools:     data.tools     || [],
        });
        setAvatarUrl(data.avatar_url || '');
        setCoverUrl(data.cover_url || '');
      }
      setNewEmail(user.email || '');
    }
    load();
  }, []);

  async function saveProfile(e) {
    e.preventDefault();
    if (!form.username.trim()) { setError('Username is required.'); return; }
    setSaving(true); setError(''); setSaved(false);
    const { error: err } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name.trim() || null,
        username:  form.username.trim(),
        bio:       form.bio.trim()      || null,
        website:   form.website.trim()  || null,
        location:  form.location.trim() || null,
        avatar_url: avatarUrl           || null,
        cover_url:  coverUrl            || null,
        tools:      form.tools,
      })
      .eq('id', profile.id);
    if (err) {
      setError(err.message);
    } else {
      // Clear Redis cache for old and new username
      try {
        const keysToClear = [`profile_data:${form.username.toLowerCase()}`];
        if (profile.username && profile.username !== form.username) {
          keysToClear.push(`profile_data:${profile.username.toLowerCase()}`);
        }
        await fetch('/api/cache/clear', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keys: keysToClear })
        });
      } catch (e) {
        console.error('Failed to clear cache', e);
      }
      
      setSaved(true);
      // Dispatch global event so Header can update instantly
      window.dispatchEvent(new Event('profile_updated'));
      router.refresh();
    }
    setSaving(false);
  }

  async function saveAuth(e) {
    e.preventDefault();
    setAuthSaving(true); setAuthMsg('');
    const updates = {};
    if (newEmail !== profile?.email) updates.email = newEmail;
    if (newPass.length >= 6) updates.password = newPass;
    if (Object.keys(updates).length === 0) { setAuthMsg('No changes to save.'); setAuthSaving(false); return; }
    const { error: err } = await supabase.auth.updateUser(updates);
    setAuthMsg(err ? err.message : 'Saved! Check your email to confirm any email changes.');
    if (!err) setNewPass('');
    setAuthSaving(false);
  }

  async function deleteAccount() {
    if (!confirm('Are you sure? This will permanently delete your account and all your projects. This cannot be undone.')) return;
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  return (
    <>

        <div style={{ maxWidth: '720px', padding: '2rem' }}>
          {/* Back */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#9b9b9b', fontWeight: 600 }}>
              <ArrowLeft size={14} /> Back
            </Link>
            <div style={{ flex: 1, height: '1px', background: '#e8e8e8' }} />
          </div>

          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '2rem' }}>Settings</h1>

          {/* Tab nav */}
          <div className="tabs" style={{ marginBottom: '2rem' }}>
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={`tab-btn ${tab === id ? 'active' : ''}`}
                onClick={() => setTab(id)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          {/* ── Profile Tab ── */}
          {tab === 'profile' && (
            <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {error && <div style={{ padding: '0.75rem 1rem', background: '#fff0f0', border: '1px solid #ffd0d0', color: '#ff3b3b', fontSize: '0.85rem' }}>{error}</div>}
              {saved && <div style={{ padding: '0.75rem 1rem', background: '#f0fff4', border: '1px solid #b7f5c8', color: '#1a8a3b', fontSize: '0.85rem' }}>✓ Profile saved successfully!</div>}

              {/* Avatar */}
              <div>
                <label style={labelStyle}>Profile Photo</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <UserAvatar src={avatarUrl} name={form.full_name || form.username} size={64} />
                  <ImageUpload
                    label=""
                    folder="avatars"
                    value={avatarUrl}
                    onUploaded={url => setAvatarUrl(url)}
                    onRemove={() => setAvatarUrl('')}
                  />
                </div>
              </div>

              {/* Cover Photo */}
              <div>
                <label style={labelStyle}>Cover Photo</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>

                  {/* Preview area */}
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: '12px', overflow: 'hidden', background: '#f9fafb', border: coverUrl ? 'none' : '1.5px dashed #d1d5db' }}>
                    {coverUrl ? (
                      <>
                        <img src={coverUrl} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        {/* Dimension badge on existing cover */}
                        <div style={{
                          position: 'absolute', bottom: '10px', right: '10px',
                          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
                          color: 'white', fontSize: '0.68rem', fontWeight: 700,
                          padding: '0.25rem 0.6rem', borderRadius: '6px',
                          letterSpacing: '0.04em', pointerEvents: 'none',
                        }}>
                          1920 × 1080 — 16:9
                        </div>
                      </>
                    ) : (
                      /* Empty state — dimension guide */
                      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1.5rem' }}>
                        {/* Aspect ratio visual */}
                        <div style={{ position: 'relative', width: '120px', height: '67.5px', border: '2px dashed #d1d5db', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.04em' }}>16 : 9</span>
                          {/* Corner ticks */}
                          {[['0','0'],['0','auto'],['auto','0'],['auto','auto']].map(([t,b], i) => (
                            <span key={i} style={{ position: 'absolute', top: t === '0' ? '-1px' : 'auto', bottom: b === '0' ? '-1px' : 'auto', left: i < 2 ? '-1px' : 'auto', right: i >= 2 ? '-1px' : 'auto', width: '8px', height: '8px', borderTop: (t === '0') ? '2px solid #9ca3af' : 'none', borderBottom: (b === '0') ? '2px solid #9ca3af' : 'none', borderLeft: (i < 2) ? '2px solid #9ca3af' : 'none', borderRight: (i >= 2) ? '2px solid #9ca3af' : 'none' }} />
                          ))}
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', margin: 0 }}>1920 × 1080 px recommended</p>
                          <p style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.2rem' }}>16:9 landscape · JPG, PNG, or WebP · max 5 MB</p>
                          <p style={{ fontSize: '0.7rem', color: '#b3b3b3', marginTop: '0.15rem' }}>This appears as your profile banner</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                    <p style={{ fontSize: '0.72rem', color: '#6b7280', lineHeight: 1.5, margin: 0 }}>
                      Shown at the top of your public profile page.{' '}
                      <span style={{ color: '#9ca3af' }}>Best at 1920 × 1080 (16:9).</span>
                    </p>
                    <ImageUpload
                      label={coverUrl ? 'Change Cover' : 'Upload Cover'}
                      folder="covers"
                      value={coverUrl}
                      onUploaded={url => setCoverUrl(url)}
                      onRemove={() => setCoverUrl('')}
                    />
                  </div>
                </div>
              </div>

              {/* Full name */}
              <div>
                <label style={labelStyle}>Full Name</label>
                <input
                  style={inputStyle}
                  value={form.full_name}
                  onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                  placeholder="Your full name"
                  maxLength={80}
                  onFocus={e => e.target.style.borderColor = '#231f20'}
                  onBlur={e => e.target.style.borderColor = '#e8e8e8'}
                />
              </div>

              {/* Username */}
              <div>
                <label style={labelStyle}>Username *</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.875rem', color: '#9b9b9b' }}>@</span>
                  <input
                    style={{ ...inputStyle, paddingLeft: '1.75rem' }}
                    value={form.username}
                    onChange={e => setForm(p => ({ ...p, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                    placeholder="username"
                    maxLength={30}
                    required
                    onFocus={e => e.target.style.borderColor = '#231f20'}
                    onBlur={e => e.target.style.borderColor = '#e8e8e8'}
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label style={labelStyle}>Bio</label>
                <textarea
                  style={{ ...inputStyle, resize: 'vertical', minHeight: '80px', lineHeight: 1.6 }}
                  value={form.bio}
                  onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                  placeholder="Tell the community about yourself..."
                  maxLength={150}
                  onFocus={e => e.target.style.borderColor = '#231f20'}
                  onBlur={e => e.target.style.borderColor = '#e8e8e8'}
                />
                <span style={{ fontSize: '0.72rem', color: '#9b9b9b' }}>{form.bio.length}/150</span>
              </div>

              {/* Website */}
              <div>
                <label style={labelStyle}>Website</label>
                <input
                  style={inputStyle}
                  value={form.website}
                  onChange={e => setForm(p => ({ ...p, website: e.target.value }))}
                  placeholder="https://yourwebsite.com"
                  type="url"
                  onFocus={e => e.target.style.borderColor = '#231f20'}
                  onBlur={e => e.target.style.borderColor = '#e8e8e8'}
                />
              </div>

              {/* Location */}
              <div>
                <label style={labelStyle}>Location</label>
                <input
                  style={inputStyle}
                  value={form.location}
                  onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                  placeholder="City, Country"
                  maxLength={60}
                  onFocus={e => e.target.style.borderColor = '#231f20'}
                  onBlur={e => e.target.style.borderColor = '#e8e8e8'}
                />
              </div>

              {/* Tools & Creative Fields */}
              <div>
                <label style={labelStyle}>Creative Fields / Tools</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {CREATIVE_TOOLS.map(t => {
                    const isSelected = form.tools.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setForm(p => ({
                            ...p,
                            tools: isSelected ? p.tools.filter(id => id !== t.id) : [...p.tools, t.id]
                          }));
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.4rem',
                          padding: '0.4rem 0.8rem', borderRadius: '20px',
                          border: isSelected ? '1px solid #2d43e8' : '1px solid #e8e8e8',
                          background: isSelected ? '#eef0ff' : 'white',
                          color: isSelected ? '#2d43e8' : '#231f20',
                          fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        <img src={t.iconPath} alt={t.name} style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
                        {t.name}
                      </button>
                    )
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 2rem', background: '#231f20', color: 'white', border: 'none', fontSize: '0.875rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: 'inherit', width: 'fit-content' }}
              >
                <Save size={14} /> {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          )}

          {/* ── Account Tab ── */}
          {tab === 'account' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <form onSubmit={saveAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem', border: '1px solid #e8e8e8', background: 'white' }}>
                <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.25rem' }}>Email & Password</h2>
                {authMsg && <div style={{ padding: '0.65rem 0.9rem', background: authMsg.includes('error') || authMsg.startsWith('Error') ? '#fff0f0' : '#f0fff4', border: `1px solid ${authMsg.includes('error') ? '#ffd0d0' : '#b7f5c8'}`, color: authMsg.includes('error') ? '#ff3b3b' : '#1a8a3b', fontSize: '0.85rem' }}>{authMsg}</div>}
                <div>
                  <label style={labelStyle}>Email</label>
                  <input style={inputStyle} value={newEmail} onChange={e => setNewEmail(e.target.value)} type="email" onFocus={e => e.target.style.borderColor = '#231f20'} onBlur={e => e.target.style.borderColor = '#e8e8e8'} />
                </div>
                <div>
                  <label style={labelStyle}>New Password</label>
                  <input style={inputStyle} value={newPass} onChange={e => setNewPass(e.target.value)} type="password" placeholder="Leave blank to keep current" minLength={6} onFocus={e => e.target.style.borderColor = '#231f20'} onBlur={e => e.target.style.borderColor = '#e8e8e8'} />
                </div>
                <button type="submit" disabled={authSaving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.5rem', background: '#231f20', color: 'white', border: 'none', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', width: 'fit-content' }}>
                  <Save size={14} /> {authSaving ? 'Saving...' : 'Update'}
                </button>
              </form>

              {/* Danger zone */}
              <div style={{ padding: '1.5rem', border: '1px solid #ffd0d0', background: '#fffafa' }}>
                <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ff3b3b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Trash2 size={15} /> Danger Zone
                </h2>
                <p style={{ fontSize: '0.85rem', color: '#6b6b6b', marginBottom: '1rem' }}>Permanently delete your account, all projects, and data. This cannot be undone.</p>
                <button onClick={deleteAccount} style={{ padding: '0.65rem 1.25rem', background: '#ff3b3b', color: 'white', border: 'none', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Delete My Account
                </button>
              </div>
            </div>
          )}
        </div>
      </>
  );
}
