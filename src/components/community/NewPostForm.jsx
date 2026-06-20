'use client';
import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import useToastStore from '@/store/useToastStore';
import { processImageFallback } from '@/lib/imageProcessFallback';
import { ImagePlus, Link as LinkIcon, X, Loader2 } from 'lucide-react';

const FLAIRS = [
  { value: 'general',  label: '💬 General',  description: 'Open discussion' },
  { value: 'question', label: '❓ Question',  description: 'Need an answer?' },
  { value: 'help',     label: '🙋 Help',      description: 'Request assistance' },
  { value: 'feedback', label: '🎨 Feedback',  description: 'Share work for critique' },
];

const MAX_BYTES = 3 * 1024 * 1024; // 3 MB

export default function NewPostForm() {
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);
  const fileRef = useRef(null);

  const [title,      setTitle]      = useState('');
  const [body,       setBody]       = useState('');
  const [linkUrl,    setLinkUrl]    = useState('');
  const [flair,      setFlair]      = useState('general');
  const [imageFile,  setImageFile]  = useState(null);  // raw File
  const [imagePreview, setImagePreview] = useState(null); // object URL
  const [uploading,  setUploading]  = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const removeImage = useCallback(() => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = '';
  }, [imagePreview]);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast({ type: 'error', message: 'Only image files are allowed.' });
      return;
    }
    if (file.size > MAX_BYTES) {
      addToast({ type: 'error', message: 'Image must be under 3 MB.' });
      return;
    }

    removeImage();
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function uploadImage(file) {
    setUploading(true);
    try {
      // Get presigned URL from existing /api/upload endpoint
      const presignRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: 'community' }),
      });
      if (!presignRes.ok) throw new Error('Could not get upload URL');
      const { coverUploadUrl, publicUrl } = await presignRes.json();

      // Compress to WebP if not already WebP (reuse existing fallback processor)
      let uploadFile = file;
      if (file.type !== 'image/webp') {
        const { optimizedBlob } = await processImageFallback(file, () => {});
        uploadFile = new File([optimizedBlob], 'post.webp', { type: 'image/webp' });
      }

      // PUT to R2 via presigned URL
      const putRes = await fetch(coverUploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'image/webp' },
        body: uploadFile,
      });
      if (!putRes.ok) throw new Error('Upload failed');

      return publicUrl;
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || title.trim().length < 3) {
      addToast({ type: 'error', message: 'Title must be at least 3 characters.' });
      return;
    }
    if (!body.trim() && !imageFile && !linkUrl.trim()) {
      addToast({ type: 'error', message: 'Add a description, image, or link.' });
      return;
    }

    setSubmitting(true);
    try {
      let image_url = null;
      if (imageFile) {
        image_url = await uploadImage(imageFile);
      }

      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:    title.trim(),
          body:     body.trim() || null,
          link_url: linkUrl.trim() || null,
          image_url,
          flair,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create post');

      addToast({ type: 'success', message: 'Post published!' });
      router.push(`/community/${data.post.id}`);
    } catch (err) {
      addToast({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  const isWorking = uploading || submitting;

  return (
    <form onSubmit={handleSubmit}>
      {/* Flair selector */}
      <div style={{ marginBottom: '1.25rem' }}>
        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.6rem' }}>
          Category
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {FLAIRS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFlair(f.value)}
              style={{
                padding: '0.45rem 0.9rem',
                borderRadius: '20px',
                border: '1.5px solid',
                borderColor: flair === f.value ? '#2d43e8' : '#e2e8f0',
                background:  flair === f.value ? '#eff1ff' : 'white',
                color:       flair === f.value ? '#2d43e8' : '#475569',
                fontSize: '0.82rem',
                fontWeight: flair === f.value ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
                fontFamily: 'inherit',
              }}
              title={f.description}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
          Title <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={300}
          placeholder="What's on your mind?"
          required
          style={{
            width: '100%', padding: '0.8rem 1rem',
            border: '1.5px solid #e8e8e8', borderRadius: '10px',
            fontSize: '0.95rem', fontFamily: 'inherit', color: '#0f172a',
            outline: 'none', background: '#fafafa', boxSizing: 'border-box',
            transition: 'border-color 0.15s',
          }}
          onFocus={(e) => e.target.style.borderColor = '#2d43e8'}
          onBlur={(e) => e.target.style.borderColor = '#e8e8e8'}
        />
        <div style={{ textAlign: 'right', fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.25rem' }}>
          {title.length}/300
        </div>
      </div>

      {/* Body */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
          Description
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Provide more context, ask your question, or describe what feedback you're looking for…"
          rows={5}
          style={{
            width: '100%', padding: '0.75rem 1rem',
            border: '1.5px solid #e8e8e8', borderRadius: '10px',
            fontSize: '0.875rem', fontFamily: 'inherit', color: '#0f172a',
            outline: 'none', background: '#fafafa', boxSizing: 'border-box',
            resize: 'vertical', transition: 'border-color 0.15s',
          }}
          onFocus={(e) => e.target.style.borderColor = '#2d43e8'}
          onBlur={(e) => e.target.style.borderColor = '#e8e8e8'}
        />
      </div>

      {/* Image upload */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
          Image <span style={{ fontWeight: 400, textTransform: 'none', color: '#94a3b8', fontSize: '0.72rem' }}>(optional · max 3 MB)</span>
        </label>

        {imagePreview ? (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img
              src={imagePreview}
              alt="preview"
              style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '10px', objectFit: 'cover', display: 'block', border: '1.5px solid #e8e8e8' }}
            />
            <button
              type="button"
              onClick={removeImage}
              style={{
                position: 'absolute', top: 8, right: 8,
                background: 'rgba(0,0,0,0.6)', border: 'none',
                borderRadius: '50%', width: 28, height: 28,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'white',
              }}
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              padding: '0.75rem 1rem', borderRadius: '10px',
              border: '1.5px dashed #cbd5e1', background: '#f8fafc',
              color: '#64748b', fontSize: '0.85rem', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
              width: '100%',
            }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = '#2d43e8'; e.currentTarget.style.background = '#eff1ff'; e.currentTarget.style.color = '#2d43e8'; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; }}
          >
            <ImagePlus size={18} />
            Attach an image
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
      </div>

      {/* Link URL */}
      <div style={{ marginBottom: '1.75rem' }}>
        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
          Link <span style={{ fontWeight: 400, textTransform: 'none', color: '#94a3b8', fontSize: '0.72rem' }}>(optional)</span>
        </label>
        <div style={{ position: 'relative' }}>
          <LinkIcon size={15} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://..."
            style={{
              width: '100%', padding: '0.8rem 1rem 0.8rem 2.4rem',
              border: '1.5px solid #e8e8e8', borderRadius: '10px',
              fontSize: '0.875rem', fontFamily: 'inherit', color: '#0f172a',
              outline: 'none', background: '#fafafa', boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#2d43e8'}
            onBlur={(e) => e.target.style.borderColor = '#e8e8e8'}
          />
        </div>
      </div>

      {/* Submit */}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isWorking}
          style={{
            padding: '0.75rem 1.5rem', borderRadius: '10px',
            border: '1.5px solid #e2e8f0', background: 'white',
            fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit', color: '#334155',
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isWorking}
          style={{
            padding: '0.75rem 2rem', borderRadius: '10px',
            background: '#231f20', color: 'white', border: 'none',
            fontSize: '0.875rem', fontWeight: 700,
            cursor: isWorking ? 'not-allowed' : 'pointer',
            opacity: isWorking ? 0.75 : 1,
            fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            transition: 'background 0.15s, opacity 0.15s',
          }}
          onMouseOver={(e) => !isWorking && (e.currentTarget.style.background = '#2d43e8')}
          onMouseOut={(e) => e.currentTarget.style.background = '#231f20'}
        >
          {isWorking && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />}
          {uploading ? 'Uploading…' : submitting ? 'Publishing…' : 'Publish Post'}
        </button>
      </div>
    </form>
  );
}
