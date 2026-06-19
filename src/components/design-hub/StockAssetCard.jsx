'use client';

import { useState } from 'react';
import { Loader2, ExternalLink, Link as LinkIcon, Download, Check, ImageOff } from 'lucide-react';
import { pixabayImageSrc } from '@/lib/utils';
import useToastStore from '@/store/useToastStore';

export default function StockAssetCard({ photo, onDownload, dlId, dlDone, priority = false }) {
  const addToast = useToastStore((state) => state.addToast);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const thumbSrc = pixabayImageSrc(photo.urls.webformat, photo.urls.preview);

  return (
    <div
      style={{
        breakInside: 'avoid',
        marginBottom: '1.25rem',
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        background: 'white',
        border: '1px solid #f0f0f0',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        aspectRatio: `${photo.imageWidth} / ${photo.imageHeight}`,
      }}
      className="stock-photo-card"
    >
      {/* Checkerboard background for transparency indication */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, opacity: 0.4,
        backgroundImage: 'repeating-linear-gradient(45deg, #f8f8f8 25%, transparent 25%, transparent 75%, #f8f8f8 75%, #f8f8f8), repeating-linear-gradient(45deg, #f8f8f8 25%, #ffffff 25%, #ffffff 75%, #f8f8f8 75%, #f8f8f8)',
        backgroundPosition: '0 0, 10px 10px',
        backgroundSize: '20px 20px',
      }} />

      {/* Broken image fallback */}
      {errored ? (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          color: '#9ca3af',
          position: 'relative',
          zIndex: 1,
          minHeight: 100,
        }}>
          <ImageOff size={24} />
          <span style={{ fontSize: '0.7rem', fontWeight: 500 }}>Asset unavailable</span>
        </div>
      ) : (
        <img
          src={thumbSrc}
          alt={photo.user?.name ? `Asset by ${photo.user.name}` : 'Stock asset'}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'low'}
          decoding={priority ? 'sync' : 'async'}
          style={{
            width: '100%',
            display: 'block',
            position: 'relative',
            zIndex: 1,
            objectFit: 'contain',
            // Fade-in transition eliminates the jarring pop when the image arrives
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            opacity: loaded ? 1 : 0,
            transform: 'scale(1)',
          }}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.02)'; }}
          onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        />
      )}

      {/* Hover overlay */}
      <div className="stock-photo-overlay" style={{
        position: 'absolute',
        inset: 0,
        zIndex: 2,
        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0) 100%)',
        opacity: 0,
        transition: 'opacity 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '0.85rem',
        gap: '0.5rem',
      }}>
        {/* Tags */}
        {photo.tags && (
          <p style={{
            fontSize: '0.7rem',
            color: 'rgba(255,255,255,0.75)',
            margin: 0,
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {photo.tags.split(',').join(' · ')}
          </p>
        )}

        {/* Creator */}
        <a
          href={`https://pixabay.com/users/${photo.user.name}-${photo.user.id}/?utm_source=desayner&utm_medium=referral`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: '0.7rem',
            color: 'rgba(255,255,255,0.8)',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
        >
          <ExternalLink size={9} />
          {photo.user.name}
        </a>

        {/* Actions Row */}
        <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
          {/* Copy Link button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(photo.urls.large);
              addToast({ type: 'success', message: 'Asset link copied to clipboard!', duration: 2500 });
            }}
            style={{
              padding: '0.55rem',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(8px)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            title="Copy Asset Link"
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
          >
            <LinkIcon size={14} />
          </button>

          {/* Download button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload(photo);
            }}
            disabled={dlId === photo.id}
            style={{
              flex: 1,
              padding: '0.55rem 0.75rem',
              background: dlDone === photo.id ? 'rgba(22, 163, 74, 0.9)' : 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(8px)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: dlId === photo.id ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s',
            }}
            onMouseOver={e => !dlDone && (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)')}
            onMouseOut={e => !dlDone && (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)')}
          >
            {dlId === photo.id ? (
              <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Downloading…</>
            ) : dlDone === photo.id ? (
              <><Check size={13} /> Downloaded!</>
            ) : (
              <><Download size={13} /> Free Download</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
