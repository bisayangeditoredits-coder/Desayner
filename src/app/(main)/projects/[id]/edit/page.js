'use client';
import { useState, useEffect, useMemo} from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ImageUpload from '@/components/misc/ImageUpload';
import TagPill from '@/components/ui/TagPill';
import Link from 'next/link';
import { X, Plus, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { CREATIVE_TOOLS } from '@/lib/constants';
import '../../../../App.css';

const CATEGORIES = ['Design', 'Illustration', 'Photography', 'Branding', '3D', 'Motion', 'UI/UX', 'Typography', 'Other'];

const inputStyle = {
  width: '100%', padding: '0.7rem 0.9rem',
  border: '1px solid #e8e8e8', background: 'white',
  fontSize: '0.9rem', outline: 'none',
  fontFamily: 'inherit', color: '#231f20', transition: 'border-color 0.15s',
};
const labelStyle = {
  display: 'block', fontSize: '0.72rem', fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.06em',
  color: '#6b6b6b', marginBottom: '0.5rem',
};

export default function EditProjectPage() {
  const { id } = useParams();
  const router  = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [form, setForm]         = useState({ title: '', description: '', category: 'Design', published: true });
  const [coverUrl, setCoverUrl] = useState('');
  const [gallery, setGallery]   = useState([]);
  const [tags, setTags]         = useState([]);
  const [tools, setTools]       = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(true);
  const [notOwner, setNotOwner] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: proj } = await supabase.from('projects').select('*').eq('id', id).single();
      if (!proj) { router.push('/projects'); return; }
      if (proj.user_id !== user.id) { setNotOwner(true); setLoading(false); return; }

      setForm({ title: proj.title, description: proj.description || '', category: proj.category || 'Design', published: proj.published });
      setCoverUrl(proj.cover_url || '');
      setGallery(proj.images || []);
      setTags(proj.tags || []);
      setTools(proj.tools || []);
      setLoading(false);
    }
    load();
  }, [id, router, supabase]);

  function addTag(e) {
    e.preventDefault();
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (t && !tags.includes(t) && tags.length < 8) { setTags(p => [...p, t]); setTagInput(''); }
  }

  function moveGalleryItem(fromIndex, toIndex) {
    setGallery((prev) => {
      const newGallery = [...prev];
      const [movedItem] = newGallery.splice(fromIndex, 1);
      newGallery.splice(toIndex, 0, movedItem);
      return newGallery;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required.'); return; }
    setSubmitting(true); setError('');

    const finalCoverUrl = coverUrl || gallery[0] || null;
    if (!finalCoverUrl) {
      setError('Please upload a cover image or at least one gallery image.');
      setSubmitting(false);
      return;
    }

    const { error: err } = await supabase.from('projects').update({
      title:       form.title.trim(),
      description: form.description.trim() || null,
      cover_url:   finalCoverUrl,
      images:      gallery,
      tags,
      tools,
      category:    form.category,
      published:   form.published,
    }).eq('id', id);

    if (err) { setError(err.message); setSubmitting(false); return; }
    router.push(`/projects/${id}`);
  }

  if (loading) return (
    <>
      <div style={{ padding: '4rem', textAlign: 'center', color: '#9b9b9b' }}>Loading...</div>
    </>
  );

  if (notOwner) return (
    <>
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <p style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Access denied</p>
        <Link href="/projects" style={{ fontSize: '0.85rem', color: '#9b9b9b' }}>← Back to Projects</Link>
      </div>
    </>
  );

  return (
    <>
        <div style={{ maxWidth: '680px', padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <Link href={`/projects/${id}`} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#9b9b9b', fontWeight: 600 }}>
              <ArrowLeft size={14} /> Back to Project
            </Link>
            <div style={{ flex: 1, height: '1px', background: '#e8e8e8' }} />
          </div>

          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.4rem', letterSpacing: '-0.03em' }}>Edit Project</h1>
          <p style={{ color: '#9b9b9b', fontSize: '0.85rem', marginBottom: '2rem' }}>Update your project details.</p>

          {error && <div style={{ padding: '0.75rem 1rem', background: '#fff0f0', border: '1px solid #ffd0d0', color: '#ff3b3b', fontSize: '0.85rem', marginBottom: '1.5rem' }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

            <ImageUpload label="Cover Image" folder="projects/covers" value={coverUrl} onUploaded={url => setCoverUrl(url)} onRemove={() => setCoverUrl('')} />

            <div>
              <label style={labelStyle}>Title *</label>
              <input style={inputStyle} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} maxLength={100} required onFocus={e => e.target.style.borderColor = '#231f20'} onBlur={e => e.target.style.borderColor = '#e8e8e8'} />
            </div>

            <div>
              <label style={labelStyle}>Description</label>
              <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '110px', lineHeight: 1.6 }} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} onFocus={e => e.target.style.borderColor = '#231f20'} onBlur={e => e.target.style.borderColor = '#e8e8e8'} />
            </div>

            <div>
              <label style={labelStyle}>Category</label>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {CATEGORIES.map(cat => <TagPill key={cat} label={cat} active={form.category === cat} onClick={() => setForm(p => ({ ...p, category: cat }))} />)}
              </div>
            </div>

            {/* Gallery */}
            <div>
              <label style={labelStyle}>Gallery Images <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>({gallery.length} added)</span></label>
              {gallery.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  {gallery.map((img, i) => (
                    <div key={i} style={{ position: 'relative', aspectRatio: '4/3', background: '#f0f0f0', overflow: 'hidden', borderRadius: '6px' }}>
                      <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      
                      {i > 0 && (
                        <button type="button" onClick={() => moveGalleryItem(i, i - 1)} style={{ position: 'absolute', bottom: '5px', left: '5px', background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: '4px' }}>
                          <ChevronLeft size={12} />
                        </button>
                      )}
                      
                      {i < gallery.length - 1 && (
                        <button type="button" onClick={() => moveGalleryItem(i, i + 1)} style={{ position: 'absolute', bottom: '5px', right: '5px', background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: '4px' }}>
                          <ChevronRight size={12} />
                        </button>
                      )}

                      <button type="button" onClick={() => setGallery(p => p.filter((_, j) => j !== i))} style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: '4px' }}>
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <ImageUpload label="" folder="projects/gallery" value="" onUploaded={url => setGallery(p => [...p, url])} onRemove={() => {}} />
            </div>

            {/* Tags */}
            <div>
              <label style={labelStyle}>Tags <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(up to 8)</span></label>
              {tags.length > 0 && (
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  {tags.map(tag => (
                    <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.6rem', background: '#231f20', color: 'white', fontSize: '0.75rem', fontWeight: 600 }}>
                      #{tag}
                      <button type="button" onClick={() => setTags(p => p.filter(t => t !== tag))} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input style={{ ...inputStyle, flex: 1 }} value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="Add a tag..." onKeyDown={e => e.key === 'Enter' && addTag(e)} onFocus={e => e.target.style.borderColor = '#231f20'} onBlur={e => e.target.style.borderColor = '#e8e8e8'} />
                <button onClick={addTag} type="button" style={{ padding: '0.7rem 1rem', background: 'white', border: '1px solid #e8e8e8', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center' }}><Plus size={14} /></button>
              </div>
            </div>

            {/* Tools Used */}
            <div>
              <label style={labelStyle}>Tools Used <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(Optional)</span></label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {CREATIVE_TOOLS.map(t => {
                  const isSelected = tools.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTools(p => isSelected ? p.filter(id => id !== t.id) : [...p, t.id])}
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: '#f9f9f9', border: '1px solid #e8e8e8' }}>
              <input type="checkbox" id="published" checked={form.published} onChange={e => setForm(p => ({ ...p, published: e.target.checked }))} style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: '#231f20' }} />
              <label htmlFor="published" style={{ fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                Published <span style={{ display: 'block', fontSize: '0.75rem', color: '#9b9b9b', fontWeight: 400 }}>Uncheck to make this project draft-only</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" disabled={submitting} style={{ padding: '0.75rem 2rem', background: '#231f20', color: 'white', border: 'none', fontSize: '0.875rem', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, fontFamily: 'inherit' }}>
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
              <Link href={`/projects/${id}`} style={{ padding: '0.75rem 1.5rem', background: 'white', color: '#6b6b6b', border: '1px solid #e8e8e8', fontSize: '0.875rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </>
  );
}
