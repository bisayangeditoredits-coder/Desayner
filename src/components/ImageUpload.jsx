'use client';
import { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import ImageCropperModal from './ImageCropperModal';

/**
 * ImageUpload — upgraded with image cropping support
 * Props:
 *   onUploaded(url)  — called with the public R2 URL after successful upload
 *   onRemove()       — called when the user removes the image
 *   value            — current URL (controlled)
 *   label            — field label text
 *   folder           — R2 sub-folder (default "uploads")
 *   accept           — MIME types string
 *   cropAspect       — aspect ratio for crop (e.g. 1 for avatar, 3 for cover banner)
 *   cropShape        — shape of the crop box ('round' or 'rect')
 */
export default function ImageUpload({
  onUploaded,
  onRemove,
  value = '',
  label = 'Image',
  folder = 'uploads',
  accept = 'image/jpeg,image/png,image/webp,image/gif',
  cropAspect,
  cropShape = 'rect',
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [cropImageSrc, setCropImageSrc] = useState('');
  const inputRef = useRef(null);

  async function uploadFile(file) {
    if (!file) return;

    const MAX_MB = 10;
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Max file size is ${MAX_MB}MB.`);
      return;
    }

    // If cropping is enabled, read file locally and open cropper instead of direct upload
    if (cropAspect) {
      const reader = new FileReader();
      reader.onload = () => {
        setCropImageSrc(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // 0. Compress Image
      const options = {
        maxSizeMB: 1, 
        maxWidthOrHeight: 1920, 
        useWebWorker: true,
        fileType: 'image/webp' 
      };
      
      const compressedFile = await imageCompression(file, options);
      const finalFile = new File([compressedFile], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
        type: 'image/webp',
      });

      // 1. Get presigned URL
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: finalFile.name, contentType: finalFile.type, folder }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get upload URL');

      // 2. PUT file directly to R2
      const putRes = await fetch(data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': finalFile.type },
        body: finalFile,
      });
      if (!putRes.ok) throw new Error('Upload to storage failed');

      // 3. Return the public URL
      onUploaded(data.publicUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleCroppedSave(croppedBlob) {
    setCropImageSrc('');
    setUploading(true);
    setError('');

    try {
      const filename = `cropped_${Date.now()}.webp`;
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, contentType: 'image/webp', folder }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get upload URL');

      const putRes = await fetch(data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'image/webp' },
        body: croppedBlob,
      });
      if (!putRes.ok) throw new Error('Upload to storage failed');

      onUploaded(data.publicUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = '';
  }

  const onDragOver = useCallback((e) => { e.preventDefault(); setDragging(true); }, []);
  const onDragLeave = useCallback(() => setDragging(false), []);
  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }, [cropAspect]);

  // ── Already has an image ──────────────────────────────────────────
  if (value) {
    return (
      <div>
        {label && <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b6b6b', marginBottom: '0.5rem' }}>{label}</p>}
        <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
          <img
            src={value}
            alt="Uploaded"
            style={{ width: '100%', maxHeight: '320px', objectFit: 'cover', border: '1px solid #e8e8e8', display: 'block', borderRadius: '8px' }}
          />
          <button
            type="button"
            onClick={onRemove}
            style={{
              position: 'absolute', top: '8px', right: '8px',
              background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none',
              width: '28px', height: '28px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', borderRadius: '50%'
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  // ── Drop zone ─────────────────────────────────────────────────────
  return (
    <div>
      {label && <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b6b6b', marginBottom: '0.5rem' }}>{label}</p>}

      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        style={{
          border: `1px dashed ${dragging ? '#0a0a0a' : error ? '#ff3b3b' : '#d0d0d0'}`,
          background: dragging ? '#f5f5f5' : '#fafafa',
          padding: '2.5rem 1rem',
          textAlign: 'center',
          cursor: uploading ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s',
          userSelect: 'none',
          borderRadius: '8px',
        }}
      >
        {uploading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <Loader2 size={24} color="#9b9b9b" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: '0.85rem', color: '#9b9b9b' }}>Uploading and processing…</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '40px', height: '40px', border: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', borderRadius: '8px' }}>
              {dragging ? <Upload size={18} color="#0a0a0a" /> : <ImageIcon size={18} color="#9b9b9b" />}
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0a0a0a', marginBottom: '0.2rem' }}>
                {dragging ? 'Drop to upload' : 'Click or drag an image here'}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#9b9b9b' }}>PNG, JPG, WebP, GIF — max 10 MB</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p style={{ fontSize: '0.78rem', color: '#ff3b3b', marginTop: '0.4rem' }}>{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {cropImageSrc && (
        <ImageCropperModal
          imageSrc={cropImageSrc}
          aspect={cropAspect}
          cropShape={cropShape}
          onClose={() => setCropImageSrc('')}
          onCropSave={handleCroppedSave}
        />
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
