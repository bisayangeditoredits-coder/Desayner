'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { Image as ImageIcon, Upload, Loader2, Check, RefreshCw } from 'lucide-react';
import getCroppedImg from '@/lib/cropImage';
import { useUpload } from '@/hooks/useUpload';

export default function CoverEditor({ value, thumbnailUrl, onUploaded }) {
  const [imageSrc, setImageSrc]           = useState(null);
  const [crop, setCrop]                   = useState({ x: 0, y: 0 });
  const [zoom, setZoom]                   = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping]       = useState(false);

  const inputRef     = useRef(null);
  const reportedRef  = useRef(null); // tracks last publicUrl we reported
  const { status, progress, result, uploadFile, cancel } = useUpload();

  const onCropComplete = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const imageDataUrl = await readFile(file);
      setImageSrc(imageDataUrl);
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleSetCover = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setIsCropping(true);

    try {
      // Get the cropped blob from the canvas
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      // Convert Blob to File so useUpload can validate it
      const file = new File([croppedBlob], 'cover.png', { type: 'image/png' });

      // useUpload handles: Worker compression → WebP → presigned URL → R2 PUT
      await uploadFile(file, 'projects/covers');
    } finally {
      setIsCropping(false);
    }
  };

  // Bubble upload result up to parent exactly once per successful upload
  useEffect(() => {
    if (status === 'done' && result?.publicUrl && result.publicUrl !== reportedRef.current) {
      reportedRef.current = result.publicUrl;
      setImageSrc(null); // exit crop mode — the value prop will render the preview
      onUploaded?.(result); // { publicUrl, thumbnailUrl, key, thumbnailKey }
    }
  }, [status, result, onUploaded]);

  const isUploading = status === 'compressing' || status === 'uploading' || isCropping;

  // If already have a cover (and no pending crop), show it
  if ((value || thumbnailUrl) && !imageSrc) {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%', background: '#111827' }}>
        <img src={thumbnailUrl || value} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', bottom: '2rem', right: '2rem' }}>
          <button
            onClick={() => inputRef.current?.click()}
            style={{ padding: '0.75rem 1.5rem', background: 'white', color: '#111827', fontWeight: 600, border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
          >
            <RefreshCw size={16} /> Replace Cover
          </button>
        </div>
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#111827', display: 'flex', flexDirection: 'column' }}>
      {!imageSrc ? (
        /* ── Empty state ── */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', padding: '2rem' }}>
          <ImageIcon size={64} style={{ marginBottom: '1rem', opacity: 0.4 }} />
          <h2 style={{ color: 'white', fontWeight: 700, marginBottom: '0.5rem', fontSize: '1.25rem' }}>Project Cover</h2>
          <p style={{ marginBottom: '1.5rem', fontSize: '0.875rem', textAlign: 'center', maxWidth: '240px' }}>
            Upload a high-quality cover for your project. It will be auto-optimized.
          </p>
          <button
            onClick={() => inputRef.current?.click()}
            style={{ padding: '0.75rem 1.5rem', background: 'white', color: '#111827', fontWeight: 600, border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Upload size={16} /> Select Image
          </button>
          <p style={{ marginTop: '1.5rem', fontSize: '0.72rem', opacity: 0.55, letterSpacing: '0.02em' }}>
            Recommended: 1200 × 900 px · 4:3 ratio · JPG / PNG / WebP
          </p>
          <p style={{ marginTop: '0.4rem', fontSize: '0.72rem', opacity: 0.45 }}>
            Auto-converted to WebP · EXIF stripped · max 10 MB
          </p>
        </div>
      ) : (
        /* ── Crop UI ── */
        <>
          <div style={{ flex: 1, position: 'relative' }}>
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={4 / 3}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
              style={{ containerStyle: { background: '#111827' } }}
            />
          </div>

          {/* Progress bar while uploading */}
          {isUploading && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: '#374151' }}>
              <div style={{ height: '100%', background: '#0009fa', width: `${progress}%`, transition: 'width 0.25s ease' }} />
            </div>
          )}

          <div style={{ padding: '0.9rem 1.25rem', background: '#1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #374151', flexShrink: 0 }}>
            <p style={{ color: '#9ca3af', fontSize: '0.78rem' }}>
              {isUploading
                ? (status === 'compressing' ? `Optimizing… ${progress}%` : `Uploading… ${progress}%`)
                : 'Drag to position · Scroll to zoom'}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => { setImageSrc(null); cancel(); }}
                disabled={isUploading}
                style={{ padding: '0.55rem 1rem', background: 'transparent', color: '#d1d5db', border: '1px solid #4b5563', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit', opacity: isUploading ? 0.5 : 1 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSetCover}
                disabled={isUploading}
                style={{ padding: '0.55rem 1.35rem', background: isUploading ? '#374151' : '#0009fa', color: 'white', border: 'none', borderRadius: '6px', cursor: isUploading ? 'not-allowed' : 'pointer', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'inherit', transition: 'background 0.15s' }}
              >
                {isUploading
                  ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> {status === 'compressing' ? 'Optimizing…' : 'Uploading…'}</>
                  : <><Check size={14} /> Set Cover</>
                }
              </button>
            </div>
          </div>
        </>
      )}

      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFileChange} style={{ display: 'none' }} />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function readFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result));
    reader.readAsDataURL(file);
  });
}
