'use client';

import { useState } from 'react';
import Cropper from 'react-easy-crop';
import { X, ZoomIn, ZoomOut, Check, RotateCw, Loader2 } from 'lucide-react';

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

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
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

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(9, 9, 11, 0.85)',
      backdropFilter: 'blur(8px)', zIndex: 10000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem', fontFamily: 'var(--font-body)'
    }}>
      <div style={{
        background: 'white', borderRadius: '16px', width: '100%',
        maxWidth: '560px', overflow: 'hidden', display: 'flex',
        flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid #e4e4e7' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#09090b' }}>Adjust Image</h3>
            <p style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '0.15rem' }}>Drag to reposition, scroll or use slider to zoom</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717a' }}>
            <X size={18} />
          </button>
        </div>

        {/* Cropper Container */}
        <div style={{ position: 'relative', width: '100%', height: '340px', background: '#09090b' }}>
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
              cropAreaClassName: aspect === 3 ? 'banner-crop-area' : 'avatar-crop-area'
            }}
          />
        </div>

        {/* Controls */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', borderTop: '1px solid #e4e4e7' }}>
          {/* Zoom slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ZoomOut size={16} color="#71717a" />
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-label="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              style={{ flex: 1, accentColor: '#2d43e8', height: '4px', cursor: 'pointer' }}
            />
            <ZoomIn size={16} color="#71717a" />
          </div>

          {/* Rotate button and Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => setRotation(r => (r + 90) % 360)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                background: '#f4f4f5', border: '1px solid #e4e4e7', borderRadius: '8px',
                padding: '0.5rem 0.75rem', fontSize: '0.8rem', fontWeight: 600,
                cursor: 'pointer', color: '#27272a', transition: 'background 0.2s'
              }}
            >
              <RotateCw size={14} /> Rotate 90°
            </button>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={onClose}
                style={{
                  background: 'none', border: '1px solid #e4e4e7', borderRadius: '8px',
                  padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: 600,
                  cursor: 'pointer', color: '#71717a'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="btn btn-dark"
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.5rem 1.25rem', borderRadius: '8px', fontSize: '0.8rem',
                  cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...
                  </>
                ) : (
                  <>
                    <Check size={14} /> Crop & Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        
        .reactEasyCrop_CropArea {
          border: 2px dashed rgba(255, 255, 255, 0.6) !important;
          box-shadow: 0 0 0 9999px rgba(9, 9, 11, 0.75) !important;
        }

        .banner-crop-area {
          border: 2px solid #2d43e8 !important;
          position: relative;
        }

        .banner-crop-area::before {
          content: '';
          position: absolute;
          bottom: 0px;
          left: 6%;
          width: 90px;
          height: 90px;
          border-radius: 50%;
          border: 2px dashed #ef4444;
          background: rgba(239, 68, 68, 0.15);
          transform: translateY(40%);
          pointer-events: none;
          z-index: 10;
          box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.9);
        }

        .banner-crop-area::after {
          content: '⚠️ Avatar Overlap Area';
          position: absolute;
          bottom: 58px;
          left: 6%;
          font-size: 10px;
          font-weight: 700;
          color: #ef4444;
          background: rgba(255, 255, 255, 0.95);
          padding: 3px 6px;
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          pointer-events: none;
          z-index: 11;
          white-space: nowrap;
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
    image.setAttribute('crossOrigin', 'anonymous'); // avoid CORS tainted canvas errors
    image.src = url;
  });
}

async function getCroppedImg(imageSrc, pixelCrop, rotation = 0) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  const rotRad = (rotation * Math.PI) / 180;

  // calculate bounding box for rotated canvas size
  const { width: bWidth, height: bHeight } = rotateSize(
    image.naturalWidth,
    image.naturalHeight,
    rotation
  );

  canvas.width = bWidth;
  canvas.height = bHeight;

  // translate canvas to center to draw rotated image
  ctx.translate(bWidth / 2, bHeight / 2);
  ctx.rotate(rotRad);
  ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

  // extract cropped area from rotated canvas
  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');

  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Return cropped image as file blob
  return new Promise((resolve) => {
    croppedCanvas.toBlob((file) => {
      resolve(file);
    }, 'image/webp', 0.95);
  });
}

function rotateSize(width, height, rotation) {
  const rotRad = (rotation * Math.PI) / 180;
  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}
