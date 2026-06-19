'use client';
import { useState, useRef, useCallback, useId } from 'react';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import ImageCropperModal from '@/components/misc/ImageCropperModal';
import { processImage } from '@/lib/processImage';
import { uploadProcessedImages } from '@/lib/uploadToR2';

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
  const fileInputId = useId();

  const putToR2 = useCallback(async (file) => {
    const MAX_MB = 10;
    if (file.size > MAX_MB * 1024 * 1024) {
      throw new Error(`Max file size is ${MAX_MB}MB.`);
    }

    const { promise, cancel } = processImage(file);
    try {
      const { optimizedBlob, thumbnailBlob } = await promise;
      const { publicUrl } = await uploadProcessedImages(folder, optimizedBlob, thumbnailBlob);
      onUploaded(publicUrl);
    } catch (err) {
      cancel();
      throw err;
    }
  }, [folder, onUploaded]);

  const uploadFile = useCallback(async (file) => {
    if (!file) return;

    if (cropAspect) {
      const reader = new FileReader();
      reader.onload = () => setCropImageSrc(reader.result);
      reader.readAsDataURL(file);
      setError('');
      return;
    }

    setUploading(true);
    setError('');

    try {
      await putToR2(file);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }, [cropAspect, putToR2]);

  async function handleCroppedSave(croppedBlob) {
    setCropImageSrc('');
    setUploading(true);
    setError('');

    try {
      const file = new File([croppedBlob], `cropped_${Date.now()}.webp`, { type: 'image/webp' });
      await putToR2(file);
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
  }, [uploadFile]);

  // ── Already has an image ──────────────────────────────────────────
  if (value) {
    // Round (avatar) preview
    if (cropShape === 'round') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          {label && <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b6b6b' }}>{label}</p>}
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img
              src={value}
              alt="Avatar"
              onError={(e) => { e.target.style.display = 'none'; }}
              style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e8e8e8', display: 'block' }}
            />
            <button
              type="button"
              onClick={onRemove}
              style={{
                position: 'absolute', top: '-4px', right: '-4px',
                background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none',
                width: '22px', height: '22px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer', borderRadius: '50%',
              }}
            >
              <X size={12} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            style={{ fontSize: '0.72rem', fontWeight: 600, color: '#2d43e8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            Change photo
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            disabled={uploading}
          />
        </div>
      );
    }

    // Rect (banner/cover) preview
    return (
      <div>
        {label && <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b6b6b', marginBottom: '0.5rem' }}>{label}</p>}
        <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
          <img
            src={value}
            alt="Uploaded"
            onError={(e) => { e.target.style.opacity = '0.3'; }}
            style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', border: '1px solid #e8e8e8', display: 'block', borderRadius: '8px' }}
          />
          <button
            type="button"
            onClick={onRemove}
            style={{
              position: 'absolute', top: '8px', right: '8px',
              background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none',
              width: '28px', height: '28px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', borderRadius: '50%',
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

      <label
        htmlFor={fileInputId}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        style={{
          display: 'block',
          border: `1px dashed ${dragging ? '#231f20' : error ? '#ff3b3b' : '#d0d0d0'}`,
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
              {dragging ? <Upload size={18} color="#231f20" /> : <ImageIcon size={18} color="#9b9b9b" />}
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#231f20', marginBottom: '0.2rem' }}>
                {dragging ? 'Drop to upload' : 'Click or drag an image here'}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#9b9b9b' }}>PNG, JPG, WebP, GIF — max 10 MB</p>
            </div>
          </div>
        )}
      </label>

      {error && (
        <p style={{ fontSize: '0.78rem', color: '#ff3b3b', marginTop: '0.4rem' }}>{error}</p>
      )}

      <input
        id={fileInputId}
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={uploading}
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
