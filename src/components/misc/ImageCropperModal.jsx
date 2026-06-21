'use client';

import { useState } from 'react';
import Cropper from 'react-easy-crop';
import { X, ZoomIn, ZoomOut, Check, RotateCw, Loader2, Crop } from 'lucide-react';

export default function ImageCropperModal({ 
  imageSrc, 
  aspect = 1, 
  cropShape = 'rect', 
  onClose, 
  onCropSave 
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [loading, setLoading] = useState(false);

  const onCropComplete = (croppedArea, cap) => {
    setCroppedAreaPixels(cap);
  };

  async function handleSave() {
    if (!croppedAreaPixels) return;
    setLoading(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      onCropSave(croppedBlob);
    } catch (err) {
      console.error(err);
      alert('Failed to crop image.');
    } finally {
      setLoading(false);
    }
  }

  const zoomPct = Math.round(((zoom - 1) / 2) * 100);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      zIndex: 10000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem', fontFamily: 'var(--font-body)',
      animation: 'cropperFadeIn 0.18s ease'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '600px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0,0,0,0.05)',
        animation: 'cropperSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #f1f5f9'
        }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Adjust Image
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, marginTop: '2px' }}>
              Drag to reposition · Scroll to zoom
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'transparent', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#64748b', transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Cropper Canvas ─────────────────────────────────────────── */}
        <div style={{ position: 'relative', width: '100%', height: '370px', background: '#0f172a' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            cropShape={cropShape}
            showGrid={true}
            onCropChange={setCrop}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            classes={{
              cropAreaClassName: aspect > 1.5 ? 'banner-crop-area' : 'avatar-crop-area'
            }}
          />
        </div>

        {/* ── Controls ───────────────────────────────────────────────── */}
        <div style={{
          padding: '1.25rem 1.5rem',
          background: '#ffffff',
          display: 'flex', flexDirection: 'column', gap: '1.25rem'
        }}>

          {/* Zoom row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setZoom(z => Math.max(1, +(z - 0.1).toFixed(1)))}
              style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: '#f8fafc', border: '1px solid #e2e8f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#64748b', flexShrink: 0, transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; }}
            >
              <ZoomOut size={16} />
            </button>

            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.05}
                aria-label="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                style={{ width: '100%', height: '4px', background: '#e2e8f0', borderRadius: '4px', appearance: 'none', outline: 'none', cursor: 'pointer' }}
              />
              {/* Custom thumb style below in style block */}
            </div>

            <button
              onClick={() => setZoom(z => Math.min(3, +(z + 0.1).toFixed(1)))}
              style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: '#f8fafc', border: '1px solid #e2e8f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#64748b', flexShrink: 0, transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; }}
            >
              <ZoomIn size={16} />
            </button>
          </div>

          {/* Action row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              onClick={() => setRotation(r => (r + 90) % 360)}
              title="Rotate 90°"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: 'transparent', border: 'none', borderRadius: '100px',
                padding: '0.6rem 1rem', fontSize: '0.875rem', fontWeight: 600,
                cursor: 'pointer', color: '#475569', transition: 'all 0.2s ease',
                flexShrink: 0
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; }}
            >
              <RotateCw size={16} />
              <span>Rotate</span>
            </button>

            <div style={{ display: 'flex', gap: '0.75rem', marginLeft: 'auto' }}>
              <button
                onClick={onClose}
                style={{
                  background: 'transparent', border: 'none', borderRadius: '100px',
                  padding: '0.75rem 1.25rem', fontSize: '0.875rem', fontWeight: 600,
                  cursor: 'pointer', color: '#64748b', transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                disabled={loading}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: loading ? '#94a3b8' : '#0f172a',
                  color: 'white', border: 'none', borderRadius: '100px',
                  padding: '0.75rem 1.5rem', fontSize: '0.875rem', fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)'
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(15, 23, 42, 0.2)'; }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.15)'; }}
              >
                {loading ? (
                  <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
                ) : (
                  <><Check size={16} /> Crop &amp; Save</>
                )}
              </button>
            </div>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes cropperFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes cropperSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }

        .reactEasyCrop_CropArea {
          border: 2px solid rgba(255,255,255,0.9) !important;
          box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.75) !important;
        }

        .banner-crop-area {
          border: 2px solid rgba(255,255,255,0.8) !important;
          box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.75) !important;
        }

        .avatar-crop-area {
          border: 2px solid rgba(255,255,255,0.8) !important;
          box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.75) !important;
        }

        .reactEasyCrop_Grid::before,
        .reactEasyCrop_Grid::after {
          border-color: rgba(255,255,255,0.2) !important;
        }

        /* Custom Range Input */
        input[type=range]::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #0f172a;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: transform 0.1s;
        }
        input[type=range]::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}

async function getCroppedImg(imageSrc, pixelCrop, rotation = 0) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  const rotRad = (rotation * Math.PI) / 180;
  const { width: bWidth, height: bHeight } = rotateSize(image.naturalWidth, image.naturalHeight, rotation);

  canvas.width = bWidth;
  canvas.height = bHeight;

  ctx.translate(bWidth / 2, bHeight / 2);
  ctx.rotate(rotRad);
  ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');

  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, pixelCrop.width, pixelCrop.height
  );

  return new Promise((resolve) => {
    croppedCanvas.toBlob((file) => resolve(file), 'image/webp', 0.95);
  });
}

function rotateSize(width, height, rotation) {
  const rotRad = (rotation * Math.PI) / 180;
  return {
    width:  Math.abs(Math.cos(rotRad) * width)  + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width)  + Math.abs(Math.cos(rotRad) * height),
  };
}
