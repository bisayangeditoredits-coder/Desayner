'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, UploadCloud } from 'lucide-react';
import { useUpload } from '@/hooks/useUpload';

const CATEGORIES = ['Figma', 'Framer', 'Webflow', 'UI Kit', 'Icon Pack', 'Font', 'Mockup', 'Other'];

export default function AssetUploadModal({ onClose, onSuccess }) {
  const [file, setFile]             = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory]     = useState('Figma');
  const [price, setPrice]           = useState('Free');
  const [link, setLink]             = useState('');
  const [saving, setSaving]         = useState(false);

  const fileInputRef = useRef(null);
  const { status, progress, result, error, uploadFile, reset } = useUpload();

  // Create preview of thumbnail/mockup image
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const saveAsset = useCallback(async (imageUrl, thumbnailUrl) => {
    setSaving(true);
    try {
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          price: price.trim(),
          link: link.trim() || null,
          thumbnail_url: thumbnailUrl,
          preview_url: imageUrl,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save asset details to database');
      }

      const data = await res.json();
      onSuccess(data.asset);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Something went wrong while saving');
    } finally {
      setSaving(false);
    }
  }, [title, description, category, price, link, onSuccess]);

  useEffect(() => {
    if (status === 'done' && result) {
      saveAsset(result.publicUrl, result.thumbnailUrl);
    }
  }, [status, result, saveAsset]);

  const handleFileChange = useCallback((e) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!file) return;
    uploadFile(file, 'assets');
  }, [file, uploadFile]);

  const handleResetFile = useCallback(() => {
    setFile(null);
    setPreviewUrl('');
    reset();
  }, [reset]);

  const isUploading = status === 'compressing' || status === 'uploading' || saving;

  return (
    <div className="inspiration-modal-overlay" onClick={onClose}>
      <div
        className="inspiration-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px', padding: '2rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Publish Template / Asset</h2>
          <button className="toast-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Preview Image Dropzone */}
          {!previewUrl ? (
            <div
              onClick={() => !isUploading && fileInputRef.current?.click()}
              style={{
                border: '2px dashed var(--border-color, #e2e8f0)',
                borderRadius: '12px',
                padding: '3rem 2rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: '#f8fafc',
                transition: 'background 0.2s',
              }}
              onMouseOver={(e) => !isUploading && (e.currentTarget.style.background = '#f1f5f9')}
              onMouseOut={(e) => !isUploading && (e.currentTarget.style.background = '#f8fafc')}
            >
              <UploadCloud size={28} color="var(--text-muted, #94a3b8)" style={{ margin: '0 auto 0.75rem' }} />
              <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}>Upload Preview Image</p>
              <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.75rem' }}>PNG, JPG, WebP up to 10MB</p>
            </div>
          ) : (
            <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', background: '#f8fafc', border: 'var(--border, 1px solid #e2e8f0)' }}>
              <img
                src={previewUrl}
                alt="Preview mockup"
                style={{ width: '100%', maxHeight: '180px', objectFit: 'contain', display: 'block' }}
              />
              {!isUploading && (
                <button
                  type="button"
                  onClick={handleResetFile}
                  style={{
                    position: 'absolute', top: '10px', right: '10px',
                    background: 'rgba(15, 23, 42, 0.7)', color: 'white',
                    border: 'none', borderRadius: '50%', width: '28px', height: '28px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {/* Form details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>Asset Title</label>
            <input
              type="text"
              placeholder="e.g. Modern Agency Portfolio Template"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isUploading}
              style={{
                width: '100%', padding: '0.65rem 0.85rem',
                border: 'var(--border, 1px solid #e2e8f0)', borderRadius: '8px',
                fontSize: '0.875rem', fontFamily: 'inherit',
              }}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>Description</label>
            <textarea
              placeholder="Describe what files, pages, or mockups are included..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isUploading}
              rows={3}
              style={{
                width: '100%', padding: '0.65rem 0.85rem',
                border: 'var(--border, 1px solid #e2e8f0)', borderRadius: '8px',
                fontSize: '0.875rem', fontFamily: 'inherit', resize: 'vertical',
              }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isUploading}
                style={{
                  width: '100%', padding: '0.65rem 0.85rem',
                  border: 'var(--border, 1px solid #e2e8f0)', borderRadius: '8px',
                  fontSize: '0.875rem', fontFamily: 'inherit', background: 'white',
                }}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>Price Label</label>
              <input
                type="text"
                placeholder="e.g. Free, $15, $49"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={isUploading}
                style={{
                  width: '100%', padding: '0.65rem 0.85rem',
                  border: 'var(--border, 1px solid #e2e8f0)', borderRadius: '8px',
                  fontSize: '0.875rem', fontFamily: 'inherit',
                }}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>Download Link / Redirect URL</label>
            <input
              type="url"
              placeholder="e.g. https://figma.com/@community/file/... or external link"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              disabled={isUploading}
              style={{
                width: '100%', padding: '0.65rem 0.85rem',
                border: 'var(--border, 1px solid #e2e8f0)', borderRadius: '8px',
                fontSize: '0.875rem', fontFamily: 'inherit',
              }}
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <p style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 600 }}>{error}</p>
          )}

          {/* Upload Progress Bar */}
          {isUploading && (
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '4px' }}>
                <span>{status === 'compressing' ? 'Optimizing preview (WebP)...' : saving ? 'Publishing...' : 'Uploading preview mockup...'}</span>
                <span>{progress}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${progress}%`, height: '100%',
                    background: 'var(--accent-blue, #0009fa)', transition: 'width 0.15s ease',
                  }}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!file || isUploading}
            style={{
              width: '100%', padding: '0.75rem', borderRadius: '8px',
              background: !file || isUploading ? '#cbd5e1' : 'var(--text-main, #0f172a)',
              color: 'white', fontWeight: 700, fontSize: '0.9rem',
              border: 'none', cursor: !file || isUploading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              marginTop: '0.5rem',
            }}
          >
            Publish Asset
          </button>
        </form>
      </div>
    </div>
  );
}
