'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import UserAvatar from '@/components/UserAvatar';
import ImageUpload from '@/components/ImageUpload';
import Link from 'next/link';
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
  fontFamily: 'inherit', color: '#0a0a0a',
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
  const supabase = createClient();

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
    if (err) setError(err.message);
    else setSaved(true);
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
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {coverUrl ? (
                    <div style={{ width: '100%', aspectRatio: '16/9', background: '#f5f5f5', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                      <img src={coverUrl} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <div style={{ width: '100%', aspectRatio: '16/9', background: '#f9fafb', border: '1px dashed #d1d5db', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '0.9rem' }}>
                      No cover photo uploaded
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Recommended size: 1920 x 1080 pixels (16:9 aspect ratio)</span>
                    <ImageUpload
                      label={coverUrl ? "Change Cover" : "Upload Cover"}
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
                  onFocus={e => e.target.style.borderColor = '#0a0a0a'}
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
                    onFocus={e => e.target.style.borderColor = '#0a0a0a'}
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
                  onFocus={e => e.target.style.borderColor = '#0a0a0a'}
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
                  onFocus={e => e.target.style.borderColor = '#0a0a0a'}
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
                  onFocus={e => e.target.style.borderColor = '#0a0a0a'}
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
                          border: isSelected ? '1px solid #0009fa' : '1px solid #e8e8e8',
                          background: isSelected ? '#eef0ff' : 'white',
                          color: isSelected ? '#0009fa' : '#0a0a0a',
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
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 2rem', background: '#0a0a0a', color: 'white', border: 'none', fontSize: '0.875rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: 'inherit', width: 'fit-content' }}
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
                  <input style={inputStyle} value={newEmail} onChange={e => setNewEmail(e.target.value)} type="email" onFocus={e => e.target.style.borderColor = '#0a0a0a'} onBlur={e => e.target.style.borderColor = '#e8e8e8'} />
                </div>
                <div>
                  <label style={labelStyle}>New Password</label>
                  <input style={inputStyle} value={newPass} onChange={e => setNewPass(e.target.value)} type="password" placeholder="Leave blank to keep current" minLength={6} onFocus={e => e.target.style.borderColor = '#0a0a0a'} onBlur={e => e.target.style.borderColor = '#e8e8e8'} />
                </div>
                <button type="submit" disabled={authSaving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.5rem', background: '#0a0a0a', color: 'white', border: 'none', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', width: 'fit-content' }}>
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
