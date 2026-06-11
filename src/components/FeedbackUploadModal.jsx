'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, UploadCloud } from 'lucide-react';
import { useUpload } from '@/hooks/useUpload';

const FEEDBACK_TYPES = [
  { value: 'general', label: 'General' },
  { value: 'typography', label: 'Typography' },
  { value: 'colors', label: 'Colors' },
  { value: 'layout', label: 'Layout' },
  { value: 'ui/ux', label: 'UI/UX' },
  { value: 'branding', label: 'Branding' },
  { value: 'illustration', label: 'Illustration' },
];

export default function FeedbackUploadModal({ onClose, onSuccess }) {
  const [file, setFile]             = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [selectedTypes, setSelectedTypes] = useState(['general']);
  const [saving, setSaving]         = useState(false);

  const fileInputRef = useRef(null);
  const { status, progress, result, error, uploadFile, reset } = useUpload();

  // Create clean blob preview URLs
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setTimeout(() => setPreviewUrl(url), 0);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const saveFeedback = useCallback(async (imageUrl, thumbnailUrl) => {
    setSaving(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          image_url: imageUrl,
          thumbnail_url: thumbnailUrl,
          feedback_type: selectedTypes,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save feedback');
      }

      const data = await res.json();
      onSuccess(data.feedback);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }, [title, description, selectedTypes, onSuccess]);

  // Sync upload store completion with DB save trigger
  useEffect(() => {
    if (status === 'done' && result) {
      setTimeout(() => saveFeedback(result.publicUrl, result.thumbnailUrl), 0);
    }
  }, [status, result, saveFeedback]);

  const handleFileChange = useCallback((e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      alert('File must be under 10MB');
      return;
    }

    setFile(selected);
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!file || !title.trim()) return;
    uploadFile(file, 'feedback');
  }, [file, title, uploadFile]);

  const handleResetFile = useCallback(() => {
    setFile(null);
    setPreviewUrl('');
    reset();
  }, [reset]);

  const toggleType = useCallback((type) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  }, []);

  const isUploading = status === 'compressing' || status === 'uploading' || saving;

  return (
    <div className="feedback-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
        <div className="feedback-modal__header">
          <h2 className="feedback-modal__title">Request Feedback</h2>
          <button className="feedback-modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form className="feedback-modal__form" onSubmit={handleSubmit}>
          {/* Image Upload */}
          {!previewUrl ? (
            <div
              className="feedback-modal__upload-area"
              onClick={() => !isUploading && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <div className="feedback-modal__upload-icon">
                <UploadCloud size={28} color="#9b9b9b" />
              </div>
              <p className="feedback-modal__upload-text">Upload your design</p>
              <p className="feedback-modal__upload-hint">JPG, PNG, WebP • Max 10MB</p>
            </div>
          ) : (
            <div className="feedback-modal__upload-area feedback-modal__upload-area--has-preview">
              <img src={previewUrl} alt="Preview" className="feedback-modal__preview" />
              {!isUploading && (
                <button
                  type="button"
                  onClick={handleResetFile}
                  className="feedback-modal__remove-preview"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}

          {/* Title */}
          <div className="feedback-modal__field">
            <label className="feedback-modal__label">Title *</label>
            <input
              type="text"
              className="feedback-modal__input"
              placeholder="e.g., Landing page design — what do you think?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              disabled={isUploading}
              required
            />
          </div>

          {/* Description */}
          <div className="feedback-modal__field">
            <label className="feedback-modal__label">Description</label>
            <textarea
              className="feedback-modal__textarea"
              placeholder="Describe what kind of feedback you're looking for..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              disabled={isUploading}
            />
          </div>

          {/* Feedback Types */}
          <div className="feedback-modal__field">
            <label className="feedback-modal__label">What kind of feedback? (select all that apply)</label>
            <div className="feedback-modal__types">
              {FEEDBACK_TYPES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleType(value)}
                  disabled={isUploading}
                  className={`feedback-modal__type-btn ${selectedTypes.includes(value) ? 'active' : ''}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="feedback-modal__error">{error}</p>
          )}

          {/* Upload Progress Bar */}
          {isUploading && (
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                <span>{status === 'compressing' ? 'Optimizing image...' : saving ? 'Saving...' : 'Uploading to cloud...'}</span>
                <span>{progress}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: '#0a0a0a', transition: 'width 0.15s ease' }} />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="feedback-modal__submit"
            disabled={!file || !title.trim() || isUploading}
          >
            {saving ? 'Saving...' : status === 'compressing' ? 'Compressing...' : status === 'uploading' ? `Uploading... ${progress}%` : 'Submit for Feedback'}
          </button>
        </form>
      </div>
    </div>
  );
}