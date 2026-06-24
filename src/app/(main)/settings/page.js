'use client';
import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import UserAvatar from '@/components/ui/UserAvatar';
import ImageUpload from '@/components/misc/ImageUpload';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Save, User, Lock, Trash2, ArrowLeft, X, ShoppingBag, Plus } from 'lucide-react';
import ProfileCompletenessCard from '@/components/profile/ProfileCompletenessCard';
import { CREATIVE_TOOLS } from '@/lib/constants';
import '../../App.css';
import useToastStore from '@/store/useToastStore';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'account', label: 'Account', icon: Lock },
];

const PRODUCT_CATEGORIES = ['UI Kit', 'Template', 'Icon Set', 'Font', 'Illustration', 'Mockup', 'Resource', 'Other'];

const inputStyle = {
  width: '100%', padding: '0.65rem 0.9rem',
  border: '1px solid #e8e8e8', background: 'white',
  fontSize: '0.875rem', outline: 'none',
  fontFamily: 'inherit', color: '#231f20',
  transition: 'border-color 0.15s',
};
const labelStyle = {
  display: 'block', fontSize: '0.85rem', fontWeight: 600,
  color: '#334155', paddingTop: '0.4rem'
};

const emptyProduct = () => ({
  id: crypto.randomUUID(),
  title: '',
  description: '',
  price: 'Free',
  category: 'UI Kit',
  url: '',
  cover_url: '',
});

export default function SettingsPage() {
  const addToast = useToastStore((s) => s.addToast);
  const [tab, setTab]         = useState('profile');
  const [profile, setProfile] = useState(null);
  const [form, setForm]       = useState({ full_name: '', username: '', bio: '', website: '', location: '', tools: [], skills: [], available_for_work: false, public_email: '' });
  const [avatarUrl, setAvatarUrl] = useState('');
  const [coverUrl, setCoverUrl]   = useState('');
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState('');
  const [newEmail, setNewEmail]   = useState('');
  const [newPass, setNewPass]     = useState('');
  const [authSaving, setAuthSaving] = useState(false);
  const [authMsg, setAuthMsg]   = useState('');
  const [tagInput, setTagInput] = useState('');

  // Shop state
  const [shop, setShop] = useState({ name: '', logo_url: '', products: [] });
  const [shopSaving, setShopSaving] = useState(false);
  const [shopSaved, setShopSaved]   = useState(false);
  const [shopError, setShopError]   = useState('');
  const [editingProduct, setEditingProduct] = useState(null); // null | product obj

  const [calendlyLink, setCalendlyLink] = useState('');

  const searchParams = useSearchParams();
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
          skills:    data.skills    || [],
          available_for_work: !!data.available_for_work,
          public_email: data.public_email || '',
        });
        setAvatarUrl(data.avatar_url || '');
        setCoverUrl(data.cover_url || '');
        setCalendlyLink(data.calendly_link || '');
        // Load shop data
        const s = data.shop || {};
        setShop({ name: s.name || '', logo_url: s.logo_url || '', products: s.products || [] });
      }
      setNewEmail(user.email || '');
    }
    load();
  }, [supabase]);

  useEffect(() => {
    const err = searchParams.get('error');
    const succ = searchParams.get('success');
    if (succ === 'calendly_connected') {
      // Small delay to ensure it renders before alerting or showing toast
      setTimeout(() => addToast({ type: 'success', message: 'Calendly connected successfully!' }), 100);
      router.replace('/settings', undefined, { shallow: true });
    } else if (err?.startsWith('calendly_')) {
      setTimeout(() => addToast({ type: 'error', message: 'Failed to connect Calendly. Please try again.' }), 100);
      router.replace('/settings', undefined, { shallow: true });
    }
  }, [searchParams, router]);

  async function clearProfileCache(username, oldUsername) {
    try {
      const keysToClear = [
        `profile_data_v2:${username.toLowerCase()}:50:0`,
        `profile_data:${username.toLowerCase()}`,
      ];
      if (oldUsername && oldUsername !== username) {
        keysToClear.push(
          `profile_data_v2:${oldUsername.toLowerCase()}:50:0`,
          `profile_data:${oldUsername.toLowerCase()}`
        );
      }
      await fetch('/api/cache/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys: keysToClear })
      });
    } catch (e) {
      console.error('Failed to clear cache', e);
    }
  }

  async function saveProfile(e) {
    e.preventDefault();
    if (!form.username.trim()) { setError('Username is required.'); return; }
    setSaving(true); setError(''); setSaved(false);
    const payload = {
      full_name: form.full_name.trim() || null,
      username:  form.username.trim(),
      bio:       form.bio.trim()      || null,
      website:   form.website.trim()  || null,
      location:  form.location.trim() || null,
      avatar_url: avatarUrl           || null,
      cover_url:  coverUrl            || null,
      tools:      form.tools,
      available_for_work: form.available_for_work,
      public_email: form.public_email.trim() || null,
    };

    let { error: err } = await supabase.from('profiles').update(payload).eq('id', profile.id);

    if (!err && form.skills.length > 0) {
      const skillsResult = await supabase.from('profiles').update({ skills: form.skills }).eq('id', profile.id);
      if (skillsResult.error?.message?.includes('skills')) {
        console.warn('skills column not migrated yet');
      } else {
        err = skillsResult.error;
      }
    }
    if (err) {
      setError(err.message);
    } else {
      await clearProfileCache(form.username, profile.username);
      setSaved(true);
      window.dispatchEvent(new Event('profile_updated'));
      router.refresh();
      router.push(`/profile/${form.username}`);
    }
    setSaving(false);
  }

  async function saveShop(e) {
    e.preventDefault();
    setShopSaving(true); setShopError(''); setShopSaved(false);
    // Validate products
    for (const p of shop.products) {
      if (!p.title.trim()) { setShopError('All products need a title.'); setShopSaving(false); return; }
      if (!p.url.trim())   { setShopError(`"${p.title}" is missing an external link.`); setShopSaving(false); return; }
    }
    const payload = {
      shop: {
        name:      shop.name.trim() || null,
        logo_url:  shop.logo_url   || null,
        products:  shop.products,
      }
    };
    const { error: err } = await supabase.from('profiles').update(payload).eq('id', profile.id);
    if (err) {
      setShopError(err.message);
    } else {
      await clearProfileCache(form.username, profile.username);
      setShopSaved(true);
      router.refresh();
    }
    setShopSaving(false);
  }

  function addProduct() {
    if (shop.products.length >= 20) return;
    const p = emptyProduct();
    setShop(s => ({ ...s, products: [...s.products, p] }));
    setEditingProduct(p.id);
  }

  function updateProduct(id, field, value) {
    setShop(s => ({ ...s, products: s.products.map(p => p.id === id ? { ...p, [field]: value } : p) }));
  }

  function removeProduct(id) {
    setShop(s => ({ ...s, products: s.products.filter(p => p.id !== id) }));
    if (editingProduct === id) setEditingProduct(null);
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
      <div style={{ maxWidth: '860px', width: '100%', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <style>{`
          .settings-row {
            display: grid;
            grid-template-columns: 200px 1fr;
            gap: 2rem;
            align-items: flex-start;
            padding-bottom: 2rem;
            border-bottom: 1px solid #f1f5f9;
          }
          @media (max-width: 640px) {
            .settings-row {
              grid-template-columns: 1fr;
              gap: 0.5rem;
              padding-bottom: 1.5rem;
            }
          }
          .shop-product-row {
            border-bottom: 1px solid #f1f5f9;
            padding-bottom: 1.5rem;
          }
          .shop-product-row:last-child {
            border-bottom: none;
            padding-bottom: 0;
          }
          .shop-product-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            cursor: pointer;
            padding: 0.75rem 0;
          }
          .shop-product-header:hover .shop-product-title {
            color: #2d43e8;
          }
          .shop-product-body {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            padding-top: 0.75rem;
          }
          .shop-product-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
          }
          @media (max-width: 560px) {
            .shop-product-grid { grid-template-columns: 1fr; }
          }
        `}</style>

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
          <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {profile && (
              <ProfileCompletenessCard
                profile={{ ...profile, ...form, avatar_url: avatarUrl, cover_url: coverUrl }}
              />
            )}
            {error && <div style={{ padding: '0.75rem 1rem', background: '#fff0f0', border: '1px solid #ffd0d0', color: '#ff3b3b', fontSize: '0.85rem' }}>{error}</div>}
            {saved && <div style={{ padding: '0.75rem 1rem', background: '#f0fff4', border: '1px solid #b7f5c8', color: '#1a8a3b', fontSize: '0.85rem' }}>✓ Profile saved successfully!</div>}

            {/* Avatar */}
            <div className="settings-row">
              <label style={labelStyle}>Profile Photo</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', width: '100%' }}>
                <UserAvatar src={avatarUrl} name={form.full_name || form.username} size={64} />
                <ImageUpload
                  label=""
                  folder="avatars"
                  value={avatarUrl}
                  cropAspect={1}
                  cropShape="round"
                  onUploaded={url => setAvatarUrl(url)}
                  onRemove={() => setAvatarUrl('')}
                />
              </div>
            </div>

            {/* Cover Photo */}
            <div className="settings-row">
              <label style={labelStyle}>Cover Photo</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', width: '100%' }}>
                <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: '12px', overflow: 'hidden', background: '#f9fafb', border: coverUrl ? 'none' : '1.5px dashed #d1d5db' }}>
                  {coverUrl ? (
                    <>
                      <img src={coverUrl} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', color: 'white', fontSize: '0.68rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '6px', letterSpacing: '0.04em', pointerEvents: 'none' }}>
                        1920 × 1080 — 16:9
                      </div>
                    </>
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1.5rem' }}>
                      <div style={{ position: 'relative', width: '120px', height: '67.5px', border: '2px dashed #d1d5db', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.04em' }}>16 : 9</span>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', margin: 0 }}>1920 × 1080 px recommended</p>
                        <p style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.2rem' }}>16:9 landscape · JPG, PNG, or WebP · max 5 MB</p>
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                  <p style={{ fontSize: '0.72rem', color: '#6b7280', lineHeight: 1.5, margin: 0 }}>
                    Shown at the top of your public profile page.{' '}
                    <span style={{ color: '#9ca3af' }}>Best at 1920 × 1080 (16:9).</span>
                  </p>
                  <ImageUpload
                    label={coverUrl ? 'Change Cover' : 'Upload Cover'}
                    folder="covers"
                    value={coverUrl}
                    cropAspect={16/9}
                    cropShape="rect"
                    onUploaded={url => setCoverUrl(url)}
                    onRemove={() => setCoverUrl('')}
                  />
                </div>
              </div>
            </div>

            {/* Full name */}
            <div className="settings-row">
              <label style={labelStyle}>Full Name</label>
              <div style={{ width: '100%' }}>
                <input style={inputStyle} value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} placeholder="Your full name" maxLength={80} onFocus={e => e.target.style.borderColor = '#231f20'} onBlur={e => e.target.style.borderColor = '#e8e8e8'} />
              </div>
            </div>

            {/* Username */}
            <div className="settings-row">
              <label style={labelStyle}>Username *</label>
              <div style={{ position: 'relative', width: '100%' }}>
                <span style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.875rem', color: '#9b9b9b' }}>@</span>
                <input style={{ ...inputStyle, paddingLeft: '1.75rem' }} value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))} placeholder="username" maxLength={30} required onFocus={e => e.target.style.borderColor = '#231f20'} onBlur={e => e.target.style.borderColor = '#e8e8e8'} />
              </div>
            </div>

            {/* Bio */}
            <div className="settings-row">
              <label style={labelStyle}>Bio</label>
              <div style={{ width: '100%' }}>
                <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '80px', lineHeight: 1.6 }} value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} placeholder="Tell the community about yourself..." maxLength={150} onFocus={e => e.target.style.borderColor = '#231f20'} onBlur={e => e.target.style.borderColor = '#e8e8e8'} />
                <span style={{ fontSize: '0.72rem', color: '#9b9b9b', display: 'block', marginTop: '0.25rem' }}>{form.bio.length}/150</span>
              </div>
            </div>

            {/* Website */}
            <div className="settings-row">
              <label style={labelStyle}>Website</label>
              <div style={{ width: '100%' }}>
                <input style={inputStyle} value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} placeholder="https://yourwebsite.com" type="url" onFocus={e => e.target.style.borderColor = '#231f20'} onBlur={e => e.target.style.borderColor = '#e8e8e8'} />
              </div>
            </div>

            {/* Location */}
            <div className="settings-row">
              <label style={labelStyle}>Location</label>
              <div style={{ width: '100%' }}>
                <input style={inputStyle} value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="City, Country" maxLength={60} onFocus={e => e.target.style.borderColor = '#231f20'} onBlur={e => e.target.style.borderColor = '#e8e8e8'} />
              </div>
            </div>

            {/* Availability */}
            <div className="settings-row">
              <label style={labelStyle}>Availability</label>
              <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', border: '1px solid', borderColor: form.available_for_work ? '#bbf7d0' : '#e8e8e8', borderRadius: '12px', background: form.available_for_work ? '#f0fdf4' : '#fafafa', transition: 'all 0.3s' }}>
                  <div style={{ paddingRight: '1rem' }}>
                    <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', fontWeight: 700, color: form.available_for_work ? '#166534' : '#0f172a' }}>Available for Work</h3>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Show a &quot;Hire Me&quot; badge on your profile to let clients know you are taking on new freelance projects.</p>
                  </div>
                  <button type="button" onClick={() => setForm(p => ({ ...p, available_for_work: !p.available_for_work }))} style={{ width: '44px', height: '24px', borderRadius: '12px', background: form.available_for_work ? '#22c55e' : '#cbd5e1', border: 'none', position: 'relative', cursor: 'pointer', transition: 'background 0.3s ease', flexShrink: 0 }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'white', position: 'absolute', top: '2px', left: form.available_for_work ? '22px' : '2px', transition: 'left 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />
                  </button>
                </div>
              </div>
            </div>

            {/* Public Email */}
            <div className="settings-row">
              <div>
                <label style={labelStyle}>Public Email</label>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginTop: '0.2rem' }}>For Clients</span>
              </div>
              <div style={{ width: '100%' }}>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 0.65rem' }}>
                  If you are available for work, clients can use this email to contact you via the &quot;Hire Me&quot; button.
                </p>
                <input style={inputStyle} value={form.public_email} onChange={e => setForm(p => ({ ...p, public_email: e.target.value }))} placeholder="hello@yourdomain.com" type="email" onFocus={e => e.target.style.borderColor = '#231f20'} onBlur={e => e.target.style.borderColor = '#e8e8e8'} />
              </div>
            </div>

            {/* Booking Integration (Calendly) */}
            <div className="settings-row">
              <div>
                <label style={labelStyle}>Booking</label>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginTop: '0.2rem' }}>Integrations</span>
              </div>
              <div style={{ width: '100%' }}>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 0.65rem' }}>
                  Connect your Calendly account to allow clients to book meetings directly from your profile.
                </p>
                {calendlyLink ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '1px solid #e8e8e8', borderRadius: '12px', background: '#fafafa' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#166534' }}>Calendly Connected</span>
                      </div>
                      <a href={calendlyLink} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: '#3b82f6', textDecoration: 'none' }}>{calendlyLink}</a>
                    </div>
                    <button 
                      type="button"
                      onClick={async () => {
                        if (confirm('Disconnect Calendly?')) {
                          await supabase.from('profiles').update({ calendly_link: null }).eq('id', profile.id);
                          setCalendlyLink('');
                          alert('Calendly disconnected');
                        }
                      }}
                      className="btn btn-outline"
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <a 
                    href="/api/calendly/auth"
                    className="btn btn-dark"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#006BFF', borderColor: '#006BFF', color: 'white' }}
                  >
                    Connect Calendly
                  </a>
                )}
              </div>
            </div>

            {/* Skills */}
            <div className="settings-row">
              <label style={labelStyle}>Skills & Specialties</label>
              <div style={{ width: '100%' }}>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 0.65rem' }}>
                  Help clients find you (e.g. UI Design, Branding, Web Design).
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.65rem' }}>
                  {form.skills.map((skill) => (
                    <span key={skill} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.75rem', borderRadius: '20px', background: '#eef0ff', color: '#2d43e8', fontSize: '0.8rem', fontWeight: 600 }}>
                      {skill}
                      <button type="button" onClick={() => setForm((p) => ({ ...p, skills: p.skills.filter((s) => s !== skill) }))} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'inherit' }} aria-label={`Remove ${skill}`}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                {form.skills.length < 8 && (
                  <input style={inputStyle} value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const skill = tagInput.trim(); if (skill && !form.skills.includes(skill)) { setForm((p) => ({ ...p, skills: [...p.skills, skill] })); setTagInput(''); } } }} placeholder="Type a skill and press Enter" maxLength={30} />
                )}
              </div>
            </div>

            {/* Creative Fields */}
            <div className="settings-row">
              <label style={labelStyle}>Creative Fields</label>
              <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {CREATIVE_TOOLS.map(t => {
                    const isSelected = form.tools.includes(t.id);
                    return (
                      <button key={t.id} type="button" onClick={() => { setForm(p => ({ ...p, tools: isSelected ? p.tools.filter(id => id !== t.id) : [...p.tools, t.id] })); }} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', borderRadius: '20px', border: isSelected ? '1px solid #2d43e8' : '1px solid #e8e8e8', background: isSelected ? '#eef0ff' : 'white', color: isSelected ? '#2d43e8' : '#231f20', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
                        <img src={t.iconPath} alt={t.name} style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
                        {t.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="settings-row" style={{ borderBottom: 'none' }}>
              <div />
              <button type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 2rem', background: '#231f20', color: 'white', border: 'none', fontSize: '0.875rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: 'inherit', width: 'fit-content' }}>
                <Save size={14} /> {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        )}

        {/* ── Account Tab ── */}
        {tab === 'account' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <form onSubmit={saveAuth} style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem', border: '1px solid #e8e8e8', background: 'white', borderRadius: '12px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.5rem' }}>Email & Password</h2>
              {authMsg && <div style={{ padding: '0.65rem 0.9rem', background: authMsg.includes('error') || authMsg.startsWith('Error') ? '#fff0f0' : '#f0fff4', border: `1px solid ${authMsg.includes('error') ? '#ffd0d0' : '#b7f5c8'}`, color: authMsg.includes('error') ? '#ff3b3b' : '#1a8a3b', fontSize: '0.85rem' }}>{authMsg}</div>}

              <div className="settings-row">
                <label style={labelStyle}>Email</label>
                <div style={{ width: '100%' }}>
                  <input style={inputStyle} value={newEmail} onChange={e => setNewEmail(e.target.value)} type="email" onFocus={e => e.target.style.borderColor = '#231f20'} onBlur={e => e.target.style.borderColor = '#e8e8e8'} />
                </div>
              </div>

              <div className="settings-row">
                <label style={labelStyle}>New Password</label>
                <div style={{ width: '100%' }}>
                  <input style={inputStyle} value={newPass} onChange={e => setNewPass(e.target.value)} type="password" placeholder="Leave blank to keep current" minLength={6} onFocus={e => e.target.style.borderColor = '#231f20'} onBlur={e => e.target.style.borderColor = '#e8e8e8'} />
                </div>
              </div>

              <div className="settings-row" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <div />
                <button type="submit" disabled={authSaving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.5rem', background: '#231f20', color: 'white', border: 'none', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', width: 'fit-content' }}>
                  <Save size={14} /> {authSaving ? 'Saving...' : 'Update'}
                </button>
              </div>
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
