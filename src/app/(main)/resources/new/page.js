'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';
import '../../../App.css';

const CATEGORIES = ['Templates', 'Mockups', 'Fonts', 'Icons', 'UI Kits', 'Tutorials'];

const inputStyle = {
  width: '100%', padding: '0.7rem 0.9rem',
  border: '1px solid #e8e8e8', background: 'white',
  fontSize: '0.9rem', outline: 'none', borderRadius: '0px',
  fontFamily: 'inherit', color: '#0a0a0a', transition: 'border-color 0.15s',
};

const labelStyle = {
  display: 'block', fontSize: '0.72rem', fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.06em',
  color: '#6b6b6b', marginBottom: '0.5rem',
};

export default function NewResourcePage() {
  const [form, setForm] = useState({ title: '', description: '', link: '', category: 'Templates' });
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.link.trim()) { setError('Title and Link are required.'); return; }
    if (!agreed) { setError('You must agree to the liability terms to share a resource.'); return; }
    
    setSubmitting(true); setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('You must be logged in.'); setSubmitting(false); return; }

    const { error: err } = await supabase.from('resources').insert({
      user_id: user.id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      link: form.link.trim(),
      thumbnail_url: thumbnailUrl || null,
      category: form.category,
    });

    if (err) { setError(err.message); setSubmitting(false); return; }
    router.push('/resources');
  }

  return (
    <>
        <div style={{ maxWidth: '680px', padding: '2rem' }}>

          {/* Back */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <Link href="/resources" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#9b9b9b', fontWeight: 600 }}>
              <ArrowLeft size={14} /> Back to Resources
            </Link>
            <div style={{ flex: 1, height: '1px', background: '#e8e8e8' }} />
          </div>

          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.4rem', letterSpacing: '-0.03em' }}>Share a Resource</h1>
          <p style={{ color: '#9b9b9b', fontSize: '0.85rem', marginBottom: '2rem' }}>Share free assets, tutorials, and tools with the Desayner community.</p>

          {error && (
            <div style={{ padding: '0.75rem 1rem', background: '#fff0f0', border: '1px solid #ffd0d0', color: '#ff3b3b', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

            {/* Thumbnail */}
            <ImageUpload
              label="Thumbnail Image (Max 5MB)"
              folder="resources/thumbnails"
              value={thumbnailUrl}
              onUploaded={url => setThumbnailUrl(url)}
              onRemove={() => setThumbnailUrl('')}
            />

            {/* Title & Link */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={labelStyle}>Resource Title *</label>
                <input
                  style={inputStyle}
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Free Minimalist UI Kit"
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>External Link *</label>
                <input
                  type="url"
                  style={inputStyle}
                  value={form.link}
                  onChange={e => setForm(p => ({ ...p, link: e.target.value }))}
                  placeholder="https://..."
                  required
                />
                <p style={{ fontSize: '0.7rem', color: '#9b9b9b', marginTop: '0.4rem' }}>Must be an external URL (Figma, GitHub, Drive, etc.)</p>
              </div>
            </div>

            {/* Category */}
            <div>
              <label style={labelStyle}>Category</label>
              <select
                style={{ ...inputStyle, cursor: 'pointer' }}
                value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label style={labelStyle}>Description</label>
              <textarea
                style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }}
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Briefly describe this resource..."
              />
            </div>

            {/* Liability Agreement */}
            <div style={{ display: 'flex', gap: '1rem', padding: '1.25rem', background: '#fff9f0', border: '1px solid #ffe8cc', borderRadius: '4px' }}>
              <ShieldAlert size={24} color="#f59e0b" style={{ flexShrink: 0 }} />
              <div>
                <label htmlFor="liability" style={{ fontSize: '0.875rem', fontWeight: 700, color: '#92400e', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    id="liability"
                    checked={agreed}
                    onChange={e => setAgreed(e.target.checked)}
                    style={{ marginTop: '0.1rem', cursor: 'pointer' }}
                  />
                  I confirm that I own the rights to share this file or it is a free/open-source asset.
                </label>
                <p style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '0.4rem', marginLeft: '1.4rem' }}>
                  By checking this box, I understand that Desayner does not host these files and is strictly an aggregation platform. Desayner is not liable for copyright infringement, pirated content, or malware linked by users.
                </p>
              </div>
            </div>

            {/* Submit */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="submit"
                disabled={submitting || !agreed}
                style={{ padding: '0.75rem 2rem', background: '#0a0a0a', color: 'white', border: 'none', fontSize: '0.875rem', fontWeight: 700, cursor: (submitting || !agreed) ? 'not-allowed' : 'pointer', opacity: (submitting || !agreed) ? 0.7 : 1, fontFamily: 'inherit' }}
              >
                {submitting ? 'Sharing...' : 'Share Resource'}
              </button>
            </div>

          </form>
        </div>
      </>
  );
}
