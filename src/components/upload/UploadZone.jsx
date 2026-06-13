'use client';
/**
 * UploadZone
 *
 * Premium single-file drag-and-drop uploader.
 * Integrates with useUpload hook for Web Worker compression,
 * progress bar, cancel, and retry.
 *
 * Props:
 *   label        — field label string
 *   folder       — R2 folder (e.g. 'projects/covers')
 *   value        — current image URL (controlled, shows preview)
 *   thumbnailUrl — current thumbnail URL (shown as badge if present)
 *   onResult(result) — called with { publicUrl, thumbnailUrl } on success
 *   onRemove()   — called when user removes the uploaded image
 *   accept       — MIME types (default covers common image types)
 */

import { useCallback, useRef, useState, useEffect } from 'react';
import { Upload, X, ImageIcon, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useUpload } from '@/hooks/useUpload';
import './UploadZone.css';

const ACCEPTED = 'image/jpeg,image/png,image/webp,image/gif,image/avif';

function formatBytes(bytes) {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadZone({ label, folder = 'uploads', value = '', thumbnailUrl = '', onResult, onRemove }) {
  const [dragging, setDragging]     = useState(false);
  const [localPreview, setLocalPreview] = useState(''); // objectURL for instant preview
  const inputRef = useRef(null);

  const { status, progress, result, error, compressionStats, uploadFile, cancel, retry } = useUpload();

  // If upload is done, use hook's result; otherwise use prop value
  const displayUrl   = result?.publicUrl || value;
  const displayThumb = result?.thumbnailUrl || thumbnailUrl;

  // Revoke the local preview objectURL when component unmounts or when
  // a new file is selected (prevents browser memory leaks)
  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  // Bubble upload result to parent exactly once per successful upload
  const doneCalledRef = useRef('');
  useEffect(() => {
    if (status === 'done' && result && result.publicUrl !== doneCalledRef.current) {
      doneCalledRef.current = result.publicUrl;
      onResult?.(result);
    }
  }, [status, result, onResult]);

  const processFile = useCallback((file) => {
    if (!file) return;
    // Instant preview before compression starts (zero latency)
    const preview = URL.createObjectURL(file);
    setLocalPreview(preview);
    uploadFile(file, folder);
  }, [folder, uploadFile]);

  const handleFiles = (files) => {
    const file = files?.[0];
    if (file) processFile(file);
  };

  const onDragOver  = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = ()  => setDragging(false);
  const onDrop      = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const onInputChange = (e) => {
    handleFiles(e.target.files);
    e.target.value = ''; // allow re-selecting same file
  };

  const handleRemove = () => {
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview('');
    onRemove?.();
  };

  const isActive = status === 'compressing' || status === 'uploading';

  // ── Preview state (image already uploaded) ──────────────────────────────
  if (displayUrl || (status === 'done' && result)) {
    const imgSrc = displayThumb || displayUrl;
    return (
      <div className="upload-zone">
        {label && <p className="upload-zone__label">{label}</p>}
        <div className="upload-zone__preview">
          <img src={imgSrc} alt="Uploaded" />
          <div className="upload-zone__preview-actions">
            <button
              type="button"
              className="upload-zone__preview-btn upload-zone__preview-btn--remove"
              onClick={handleRemove}
            >
              <X size={12} /> Remove
            </button>
            <button
              type="button"
              className="upload-zone__preview-btn"
              style={{ background: 'rgba(255,255,255,0.9)', color: '#231f20' }}
              onClick={() => inputRef.current?.click()}
            >
              <RefreshCw size={12} /> Replace
            </button>
          </div>
          {compressionStats && (
            <div className="upload-zone__stats">
              {formatBytes(compressionStats.optimizedSize)} · saved {compressionStats.savedPct}%
            </div>
          )}
        </div>
        <input ref={inputRef} type="file" accept={ACCEPTED} onChange={onInputChange} style={{ display: 'none' }} />
      </div>
    );
  }

  // ── Loading/progress state ───────────────────────────────────────────────
  if (isActive || (localPreview && status !== 'error')) {
    const stageLabel = status === 'compressing'
      ? `Optimizing image…`
      : 'Uploading to cloud…';

    return (
      <div className="upload-zone">
        {label && <p className="upload-zone__label">{label}</p>}
        <div className="upload-zone__drop upload-zone__drop--disabled">
          {localPreview && (
            <img
              src={localPreview}
              alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.25, borderRadius: '4px' }}
            />
          )}
          <div className="upload-zone__progress-wrap" style={{ position: 'relative', zIndex: 1 }}>
            <p className="upload-zone__progress-label">{stageLabel}</p>
            <div className="upload-zone__bar-track">
              <div className="upload-zone__bar-fill" style={{ width: `${progress}%` }} />
            </div>
            <p className="upload-zone__pct">{progress}%</p>
            <button type="button" className="upload-zone__cancel-btn" onClick={cancel}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div className="upload-zone">
        {label && <p className="upload-zone__label">{label}</p>}
        <div
          className="upload-zone__drop upload-zone__drop--error"
          onClick={() => inputRef.current?.click()}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          tabIndex={0}
          role="button"
        >
          <div className="upload-zone__icon" style={{ borderColor: '#ff3b30' }}>
            <AlertCircle size={20} color="#ff3b30" />
          </div>
          <p className="upload-zone__title" style={{ color: '#ff3b30' }}>Upload failed</p>
          <p className="upload-zone__hint">Click or drop a new file to try again</p>
        </div>
        <div className="upload-zone__error">
          <AlertCircle size={14} color="#cc0000" style={{ flexShrink: 0, marginTop: '1px' }} />
          <p>{error}</p>
          <button type="button" className="upload-zone__retry-btn" onClick={retry}>Retry</button>
        </div>
        <input ref={inputRef} type="file" accept={ACCEPTED} onChange={onInputChange} style={{ display: 'none' }} />
      </div>
    );
  }

  // ── Idle drop zone ───────────────────────────────────────────────────────
  return (
    <div className="upload-zone">
      {label && <p className="upload-zone__label">{label}</p>}
      <div
        className={`upload-zone__drop ${dragging ? 'upload-zone__drop--dragging' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        tabIndex={0}
        role="button"
        aria-label="Upload image"
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        <div className="upload-zone__icon">
          {dragging ? <Upload size={20} color="#2d43e8" /> : <ImageIcon size={20} color="#9b9b9b" />}
        </div>
        <p className="upload-zone__title">
          {dragging ? 'Drop to upload' : 'Click or drag an image here'}
        </p>
        <p className="upload-zone__hint">
          JPG, PNG, WebP, GIF — max 10 MB<br />
          <strong>Auto-converted to WebP &amp; compressed before upload</strong>
        </p>
      </div>
      <input ref={inputRef} type="file" accept={ACCEPTED} onChange={onInputChange} style={{ display: 'none' }} />
    </div>
  );
}
