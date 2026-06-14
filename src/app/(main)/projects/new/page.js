'use client';
import { useState, useRef, useMemo} from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import TagPill from '@/components/TagPill';
import Link from 'next/link';
import { X, Plus, ArrowLeft } from 'lucide-react';
import { CREATIVE_TOOLS } from '@/lib/constants';
import { saveProjectModalReturn } from '@/lib/projectModalNav';
import '../../../App.css';

// ── Lazy load heavy components so the page shell renders instantly ───────────
// CoverEditor pulls in react-easy-crop (large)
// MultiUploadZone pulls in processImage + Worker pipeline (large)
const CoverEditor = dynamic(() => import('@/components/CoverEditor'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100%', height: '100%', minHeight: '280px',
      background: '#f0f0f0', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: '0.75rem', color: '#9b9b9b',
    }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#e0e0e0', animation: 'shimmer 1.5s infinite' }} />
      <div style={{ width: 120, height: 12, borderRadius: 6, background: '#e0e0e0', animation: 'shimmer 1.5s infinite' }} />
    </div>
  ),
});

const MultiUploadZone = dynamic(() => import('@/components/upload/MultiUploadZone'), {
  ssr: false,
  loading: () => (
    <div style={{
      border: '1.5px dashed #d0d0d0', background: '#fafafa',
      padding: '1.75rem 1rem', textAlign: 'center', borderRadius: 4,
    }}>
      <div style={{ width: 80, height: 12, borderRadius: 6, background: '#e0e0e0', margin: '0 auto 0.5rem', animation: 'shimmer 1.5s infinite' }} />
      <div style={{ width: 140, height: 10, borderRadius: 6, background: '#e0e0e0', margin: '0 auto', animation: 'shimmer 1.5s infinite' }} />
    </div>
  ),
});

const CATEGORIES = ['Design', 'Illustration', 'Photography', 'Branding', '3D', 'Motion', 'UI/UX', 'Typography', 'Other'];

const inputStyle = {
  width: '100%', padding: '0.85rem 1rem',
  border: '1px solid #d1d5db', background: '#f9fafb',
  fontSize: '0.95rem', outline: 'none', borderRadius: '10px',
  fontFamily: 'inherit', color: '#111827', transition: 'all 0.2s ease',
};

const labelStyle = {
  display: 'block', fontSize: '0.85rem', fontWeight: 600,
  color: '#374151', marginBottom: '0.5rem',
};

export default function NewProjectPage() {
  const [form, setForm]             = useState({ title: '', description: '', category: 'Design', published: true, external_link: '' });
  const [coverUrl, setCoverUrl]     = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  // gallery: array of { publicUrl, thumbnailUrl }
  const [gallery, setGallery]       = useState([]);
  const [tags, setTags]             = useState([]);
  const [tools, setTools]           = useState([]);
  const [tagInput, setTagInput]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const router   = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // ── CoverEditor result ──────────────────────────────────────────────────────
  function handleCoverResult(result) {
    // result = { publicUrl, thumbnailUrl, key, thumbnailKey }
    setCoverUrl(result.publicUrl);
    setThumbnailUrl(result.thumbnailUrl || '');
  }

  function handleCoverRemove() {
    setCoverUrl('');
    setThumbnailUrl('');
  }

  // ── Gallery result (MultiUploadZone calls onResults once per new item) ───────
  function handleGalleryResult(item) {
    setGallery((prev) => [...prev, item]);
  }

  function removeGalleryItem(index) {
    setGallery((prev) => prev.filter((_, i) => i !== index));
  }

  function addTag(e) {
    e.preventDefault();
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (t && !tags.includes(t) && tags.length < 8) { setTags((p) => [...p, t]); setTagInput(''); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required.'); return; }
    setSubmitting(true); setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('You must be logged in.'); setSubmitting(false); return; }

    // Build images array (full URLs) and image_thumbnails array for Supabase
    const galleryUrls      = gallery.map((g) => g.publicUrl);
    const galleryThumbnails = gallery.map((g) => g.thumbnailUrl || g.publicUrl);
    
    const finalCoverUrl = coverUrl || galleryUrls[0] || null;
    if (!finalCoverUrl) {
      setError('Please upload a cover image or at least one gallery image.');
      setSubmitting(false);
      return;
    }

    const { count: existingCount } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('published', true);

    const { data, error: err } = await supabase.from('projects').insert({
      user_id:       user.id,
      title:         form.title.trim(),
      description:   form.description.trim() || null,
      cover_url:     coverUrl || galleryUrls[0] || null,
      thumbnail_url: thumbnailUrl || galleryThumbnails[0] || null,
      images:        galleryUrls,
      tags,
      tools,
      category:      form.category,
      published:     form.published,
      external_link: form.external_link.trim() || null,
    }).select().single();

    if (err) { setError(err.message); setSubmitting(false); return; }

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single();

    window.dispatchEvent(new Event('profile_updated'));

    if ((existingCount || 0) === 0 && userProfile?.username) {
      router.push(`/profile/${userProfile.username}?firstProject=1`);
    } else {
      router.push('/projects');
    }
    router.refresh();
  }

  return (
    <>
        <div style={{ background: '#fcfcfc', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

        {/* Two-column split layout */}
        <div className="new-project-layout">

          {/* ── Left: Cover editor ── */}
          <div className="new-project-left">
            <CoverEditor
              value={coverUrl}
              thumbnailUrl={thumbnailUrl}
              onUploaded={handleCoverResult}
            />
          </div>

          {/* ── Right: Form ── */}
          <div className="new-project-right">

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <Link href="/projects" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#9b9b9b', fontWeight: 600, textDecoration: 'none' }}>
                <ArrowLeft size={14} /> Back
              </Link>
            </div>

            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.03em', color: '#111827' }}>
              Create New Project
            </h1>
            <p style={{ color: '#6b7280', fontSize: '1rem', marginBottom: '2.5rem' }}>
              Share your best work with the Desayner community.
            </p>

            {error && (
              <div style={{ padding: '0.75rem 1rem', background: '#fff0f0', border: '1px solid #ffd0d0', color: '#ff3b3b', fontSize: '0.85rem', marginBottom: '1.5rem', borderRadius: '8px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

              {/* Title */}
              <div>
                <label style={labelStyle}>Title *</label>
                <input
                  style={inputStyle}
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="My Awesome Project"
                  maxLength={100}
                  required
                  onFocus={(e) => (e.target.style.borderColor = '#231f20')}
                  onBlur={(e)  => (e.target.style.borderColor = '#d1d5db')}
                />
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  style={{ ...inputStyle, resize: 'vertical', minHeight: '110px', lineHeight: 1.6 }}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Describe your project, process, tools used..."
                  onFocus={(e) => (e.target.style.borderColor = '#231f20')}
                  onBlur={(e)  => (e.target.style.borderColor = '#d1d5db')}
                />
              </div>

              {/* External Link */}
              <div>
                <label style={labelStyle}>
                  Project Link <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(Optional)</span>
                </label>
                <input
                  style={inputStyle}
                  type="url"
                  value={form.external_link}
                  onChange={(e) => setForm((p) => ({ ...p, external_link: e.target.value }))}
                  placeholder="https://behance.net/... or Live Demo URL"
                  onFocus={(e) => (e.target.style.borderColor = '#231f20')}
                  onBlur={(e)  => (e.target.style.borderColor = '#d1d5db')}
                />
              </div>

              {/* Category */}
              <div>
                <label style={labelStyle}>Category</label>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {CATEGORIES.map((cat) => (
                    <TagPill key={cat} label={cat} active={form.category === cat} onClick={() => setForm((p) => ({ ...p, category: cat }))} />
                  ))}
                </div>
              </div>

              {/* Gallery — multi upload */}
              <div>
                <label style={labelStyle}>
                  Gallery Images <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>({gallery.length} added)</span>
                </label>
                <MultiUploadZone
                  folder="projects/gallery"
                  value={gallery.map((g) => g.thumbnailUrl || g.publicUrl)}
                  onResults={handleGalleryResult}
                  onRemove={removeGalleryItem}
                  maxFiles={20}
                />
              </div>

              {/* Tags */}
              <div>
                <label style={labelStyle}>Tags <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(up to 8)</span></label>
                {tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    {tags.map((tag) => (
                      <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.6rem', background: '#231f20', color: 'white', fontSize: '0.75rem', fontWeight: 600, borderRadius: '4px' }}>
                        #{tag}
                        <button type="button" onClick={() => setTags((p) => p.filter((t) => t !== tag))} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    style={{ ...inputStyle, flex: 1 }}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag and press Enter..."
                    onKeyDown={(e) => e.key === 'Enter' && addTag(e)}
                    onFocus={(e) => (e.target.style.borderColor = '#231f20')}
                    onBlur={(e)  => (e.target.style.borderColor = '#d1d5db')}
                  />
                  <button
                    onClick={addTag}
                    type="button"
                    style={{ padding: '0.7rem 1rem', background: 'white', color: '#231f20', border: '1px solid #d1d5db', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', borderRadius: '10px' }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Tools Used */}
              <div>
                <label style={labelStyle}>Tools Used <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(Optional)</span></label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {CREATIVE_TOOLS.map((t) => {
                    const isSelected = tools.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTools((p) => isSelected ? p.filter((id) => id !== t.id) : [...p, t.id])}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.4rem',
                          padding: '0.4rem 0.8rem', borderRadius: '20px',
                          border: isSelected ? '1px solid #2d43e8' : '1px solid #e8e8e8',
                          background: isSelected ? '#eef0ff' : 'white',
                          color: isSelected ? '#2d43e8' : '#231f20',
                          fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        <img src={t.iconPath} alt={t.name} style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
                        {t.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Visibility */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <input
                  type="checkbox"
                  id="published"
                  checked={form.published}
                  onChange={(e) => setForm((p) => ({ ...p, published: e.target.checked }))}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#231f20' }}
                />
                <label htmlFor="published" style={{ cursor: 'pointer' }}>
                  <span style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600, color: '#111827' }}>Publish immediately</span>
                  <span style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginTop: '0.1rem' }}>Uncheck to save as draft (only visible to you)</span>
                </label>
              </div>

              {/* Submit */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', paddingBottom: '3rem' }}>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '0.85rem 2.5rem', background: '#231f20', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, transition: 'all 0.2s', fontFamily: 'inherit' }}
                >
                  {submitting ? 'Publishing...' : form.published ? 'Publish Project' : 'Save Draft'}
                </button>
                <Link
                  href="/projects"
                  style={{ padding: '0.85rem 2rem', background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', transition: 'all 0.2s', textDecoration: 'none' }}
                >
                  Cancel
                </Link>
              </div>

            </form>
          </div>
        </div>
      </div>
    </>
  );
}
