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
        borderRadius: '20px',
        width: '100%',
        maxWidth: '580px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 40px -15px rgba(45, 67, 232, 0.15), 0 10px 20px -10px rgba(0, 0, 0, 0.08)',
        animation: 'cropperSlideUp 0.22s cubic-bezier(0.34,1.56,0.64,1)'
      }}>

        {/* ── Brand accent bar ─────────────────────────────────────── */}
        <div style={{ height: '5px', background: 'linear-gradient(90deg, #2d43e8 0%, #3b82f6 100%)' }} />

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 1.4rem',
          borderBottom: '1px solid #f1f5f9'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '10px',
              background: 'rgba(45,67,232,0.08)',
              border: '1px solid rgba(45,67,232,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Crop size={16} color="#2d43e8" />
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Adjust Image
              </h3>
              <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: 0, marginTop: '1px' }}>
                Drag to reposition · scroll to zoom
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px', height: '32px', borderRadius: '9px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#94a3b8', transition: 'all 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            <X size={15} />
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
          padding: '1rem 1.4rem',
          background: '#f8fafc',
          borderTop: '1px solid #f1f5f9',
          display: 'flex', flexDirection: 'column', gap: '0.9rem'
        }}>

          {/* Zoom row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              onClick={() => setZoom(z => Math.max(1, +(z - 0.1).toFixed(1)))}
              style={{
                width: '30px', height: '30px', borderRadius: '8px',
                background: 'white', border: '1px solid #e4e4e7',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#71717a', flexShrink: 0, transition: 'all 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#2d43e8'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#e4e4e7'}
            >
              <ZoomOut size={14} />
            </button>

            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.05}
                aria-label="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#2d43e8', cursor: 'pointer' }}
              />
            </div>

            <button
              onClick={() => setZoom(z => Math.min(3, +(z + 0.1).toFixed(1)))}
              style={{
                width: '30px', height: '30px', borderRadius: '8px',
                background: 'white', border: '1px solid #e4e4e7',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#71717a', flexShrink: 0, transition: 'all 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#2d43e8'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#e4e4e7'}
            >
              <ZoomIn size={14} />
            </button>

            <span style={{
              fontSize: '0.72rem', fontWeight: 700, color: '#2d43e8',
              background: 'rgba(45,67,232,0.08)', borderRadius: '6px',
              padding: '0.25rem 0.55rem', minWidth: '38px', textAlign: 'center',
              flexShrink: 0
            }}>
              {zoomPct}%
            </span>
          </div>

          {/* Action row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
            <button
              onClick={() => setRotation(r => (r + 90) % 360)}
              title="Rotate 90°"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                background: 'white', border: '1px solid #e4e4e7', borderRadius: '10px',
                padding: '0.55rem 0.9rem', fontSize: '0.8rem', fontWeight: 600,
                cursor: 'pointer', color: '#374151', transition: 'all 0.15s',
                flexShrink: 0
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#2d43e8'; e.currentTarget.style.color = '#2d43e8'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e4e4e7'; e.currentTarget.style.color = '#374151'; }}
            >
              <RotateCw size={14} />
              <span>Rotate 90°</span>
            </button>

            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
              <button
                onClick={onClose}
                style={{
                  background: 'white', border: '1px solid #e4e4e7', borderRadius: '10px',
                  padding: '0.55rem 1.1rem', fontSize: '0.82rem', fontWeight: 600,
                  cursor: 'pointer', color: '#6b7280', transition: 'all 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#94a3b8'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#e4e4e7'}
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                disabled={loading}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.45rem',
                  background: loading ? '#94a3b8' : '#2d43e8',
                  color: 'white', border: 'none', borderRadius: '10px',
                  padding: '0.55rem 1.25rem', fontSize: '0.82rem', fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#2536c5'; }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#2d43e8'; }}
              >
                {loading ? (
                  <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
                ) : (
                  <><Check size={14} /> Crop &amp; Save</>
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
          box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.7) !important;
        }

        .banner-crop-area {
          border: 2px solid #2d43e8 !important;
          box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.7), 0 0 0 4px rgba(45,67,232,0.2) !important;
        }

        .avatar-crop-area {
          border: 2px solid #2d43e8 !important;
          box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.7), 0 0 0 4px rgba(45,67,232,0.2) !important;
        }

        .reactEasyCrop_Grid::before,
        .reactEasyCrop_Grid::after {
          border-color: rgba(255,255,255,0.12) !important;
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
