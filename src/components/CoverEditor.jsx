'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { Image as ImageIcon, Upload, Loader2, Check, RefreshCw, Crop } from 'lucide-react';
import getCroppedImg from '@/lib/cropImage';
import { useUpload } from '@/hooks/useUpload';

const previewPanelStyle = {
  position: 'relative',
  width: '100%',
  height: '100%',
  minHeight: '280px',
  background: '#f0f0f0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'auto',
  padding: '1.5rem',
};

const previewImgStyle = {
  maxWidth: '100%',
  maxHeight: '100%',
  width: 'auto',
  height: 'auto',
  objectFit: 'contain',
  display: 'block',
};

export default function CoverEditor({ value, thumbnailUrl, onUploaded }) {
  const [imageSrc, setImageSrc] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [pendingPreview, setPendingPreview] = useState(null);
  const [cropMode, setCropMode] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);

  const inputRef = useRef(null);
  const reportedRef = useRef(null);
  const { status, progress, result, uploadFile, cancel } = useUpload();

  const onCropComplete = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const resetPending = useCallback(() => {
    setPendingFile(null);
    setPendingPreview(null);
    setImageSrc(null);
    setCropMode(false);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    cancel();
  }, [cancel]);

  const handleFileChange = async (e) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    const imageDataUrl = await readFile(file);
    setPendingFile(file);
    setPendingPreview(imageDataUrl);
    setImageSrc(null);
    setCropMode(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleUploadAsIs = async () => {
    if (!pendingFile) return;
    await uploadFile(pendingFile, 'projects/covers');
  };

  const handleStartCrop = () => {
    if (!pendingPreview) return;
    setImageSrc(pendingPreview);
    setCropMode(true);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleSetCover = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setIsCropping(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const file = new File([croppedBlob], 'cover.png', { type: 'image/png' });
      await uploadFile(file, 'projects/covers');
    } finally {
      setIsCropping(false);
    }
  };

  useEffect(() => {
    if (status === 'done' && result?.publicUrl && result.publicUrl !== reportedRef.current) {
      reportedRef.current = result.publicUrl;
      resetPending();
      onUploaded?.(result);
    }
  }, [status, result, onUploaded, resetPending]);

  const isUploading = status === 'compressing' || status === 'uploading' || isCropping;

  // Existing cover preview
  if ((value || thumbnailUrl) && !pendingPreview && !imageSrc) {
    return (
      <div style={previewPanelStyle}>
        <img src={thumbnailUrl || value} alt="Cover" style={previewImgStyle} />
        <div style={{ position: 'absolute', bottom: '1.5rem', right: '1.5rem' }}>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            style={{ padding: '0.75rem 1.5rem', background: 'white', color: '#111827', fontWeight: 600, border: '1px solid #e8e8e8', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
          >
            <RefreshCw size={16} /> Replace Cover
          </button>
        </div>
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
      </div>
    );
  }

  // Pending file — upload as-is (default) or adjust crop
  if (pendingPreview && !cropMode) {
    return (
      <div style={{ ...previewPanelStyle, flexDirection: 'column', gap: '1rem' }}>
        <img src={pendingPreview} alt="Cover preview" style={previewImgStyle} />
        {isUploading && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: '#e8e8e8' }}>
            <div style={{ height: '100%', background: '#0009fa', width: `${progress}%`, transition: 'width 0.25s ease' }} />
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={resetPending}
            disabled={isUploading}
            style={{ padding: '0.6rem 1rem', background: 'white', color: '#6b6b6b', border: '1px solid #e8e8e8', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit', opacity: isUploading ? 0.5 : 1 }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleStartCrop}
            disabled={isUploading}
            style={{ padding: '0.6rem 1rem', background: 'white', color: '#0a0a0a', border: '1px solid #e8e8e8', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '0.35rem', opacity: isUploading ? 0.5 : 1 }}
          >
            <Crop size={14} /> Adjust crop
          </button>
          <button
            type="button"
            onClick={handleUploadAsIs}
            disabled={isUploading}
            style={{ padding: '0.6rem 1.25rem', background: isUploading ? '#94a3b8' : '#0009fa', color: 'white', border: 'none', borderRadius: '6px', cursor: isUploading ? 'not-allowed' : 'pointer', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'inherit' }}
          >
            {isUploading
              ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> {status === 'compressing' ? 'Optimizing…' : 'Uploading…'}</>
              : <><Check size={14} /> Use this image</>
            }
          </button>
        </div>
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '280px', background: '#f0f0f0', display: 'flex', flexDirection: 'column' }}>
      {!imageSrc ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#6b6b6b', padding: '2rem' }}>
          <ImageIcon size={64} style={{ marginBottom: '1rem', opacity: 0.35, color: '#9b9b9b' }} />
          <h2 style={{ color: '#0a0a0a', fontWeight: 700, marginBottom: '0.5rem', fontSize: '1.25rem' }}>Project Cover</h2>
          <p style={{ marginBottom: '1.5rem', fontSize: '0.875rem', textAlign: 'center', maxWidth: '280px' }}>
            Upload your cover image. Any aspect ratio works — it will display naturally in the feed.
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            style={{ padding: '0.75rem 1.5rem', background: '#0009fa', color: 'white', fontWeight: 600, border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Upload size={16} /> Select Image
          </button>
          <p style={{ marginTop: '1.5rem', fontSize: '0.72rem', opacity: 0.55, letterSpacing: '0.02em' }}>
            JPG / PNG / WebP · Auto-converted to WebP · max 10 MB
          </p>
        </div>
      ) : (
        <>
          <div style={{ flex: 1, position: 'relative', minHeight: '240px' }}>
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
              style={{ containerStyle: { background: '#e8e8e8' } }}
            />
          </div>

          {isUploading && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: '#e8e8e8' }}>
              <div style={{ height: '100%', background: '#0009fa', width: `${progress}%`, transition: 'width 0.25s ease' }} />
            </div>
          )}

          <div style={{ padding: '0.9rem 1.25rem', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e8e8e8', flexShrink: 0 }}>
            <p style={{ color: '#6b6b6b', fontSize: '0.78rem' }}>
              {isUploading
                ? (status === 'compressing' ? `Optimizing… ${progress}%` : `Uploading… ${progress}%`)
                : 'Drag to position · Scroll to zoom'}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                type="button"
                onClick={resetPending}
                disabled={isUploading}
                style={{ padding: '0.55rem 1rem', background: 'transparent', color: '#6b6b6b', border: '1px solid #e8e8e8', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit', opacity: isUploading ? 0.5 : 1 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSetCover}
                disabled={isUploading}
                style={{ padding: '0.55rem 1.35rem', background: isUploading ? '#94a3b8' : '#0009fa', color: 'white', border: 'none', borderRadius: '6px', cursor: isUploading ? 'not-allowed' : 'pointer', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'inherit' }}
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
