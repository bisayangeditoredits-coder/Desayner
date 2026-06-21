'use client';

import React, { useState } from 'react';
import { Loader2, Heart, ExternalLink, Link as LinkIcon, Download, Check, ImageOff } from 'lucide-react';
import Image from 'next/image';
import { unsplashImageSrc } from '@/lib/utils';
import useToastStore from '@/store/useToastStore';

function StockPhotoCard({
  photo,
  onSave,
  savingId,
  savedPhotoIds,
  onDownload,
  dlId,
  dlDone,
  priority = false,
}) {
  const addToast = useToastStore((state) => state.addToast);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  // Use thumbnail-optimised size for card display (saves bandwidth vs full `regular`)
  // Unsplash Imgix: w=600 serves sharp images up to 300px @2x retina screens
  const thumbSrc = unsplashImageSrc(photo.urls.small, 600, 75);

  return (
    <div
      style={{
        breakInside: 'avoid',
        marginBottom: '1.25rem',
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        // Use the Unsplash dominant colour as background so users see something
        // immediately while the image loads — prevents the jarring white flash
        background: photo.color || '#f4f5f5',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        aspectRatio: `${photo.width} / ${photo.height}`,
      }}
      className="stock-photo-card"
    >
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
          background: '#f9fafb',
          minHeight: 120,
        }}>
          <ImageOff size={24} />
          <span style={{ fontSize: '0.7rem', fontWeight: 500 }}>Image unavailable</span>
        </div>
      ) : (
        <Image
          src={thumbSrc}
          alt={photo.description || `Photo by ${photo.user.name}`}
          // Use Next.js built‑in lazy loading; placeholder blur for LQIP
          placeholder="blur"
          blurDataURL={unsplashImageSrc(photo.urls.thumb, 20, 20)}
          priority={priority}
          width={photo.width}
          height={photo.height}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            opacity: loaded ? 1 : 0,
            transform: 'scale(1)',
          }}
          onLoadingComplete={() => setLoaded(true)}
          onError={() => setErrored(true)}
        />
      )}

      {/* Hover overlay */}
      <div className="stock-photo-overlay" style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0) 100%)',
        opacity: 0,
        transition: 'opacity 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '0.85rem',
        gap: '0.5rem',
      }}>
        {/* Save Heart Button (Top Right) */}
        <button
          onClick={() => onSave(photo)}
          disabled={savingId === photo.id}
          style={{
            position: 'absolute',
            top: '0.75rem',
            right: '0.75rem',
            background: savedPhotoIds.has(photo.id) ? '#ef4444' : 'rgba(255,255,255,0.9)',
            color: savedPhotoIds.has(photo.id) ? 'white' : '#231f20',
            border: 'none',
            borderRadius: '50%',
            width: '2.2rem',
            height: '2.2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: savingId === photo.id ? 'wait' : 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
          title={savedPhotoIds.has(photo.id) ? 'Remove from Moodboard' : 'Save to Moodboard'}
        >
          {savingId === photo.id ? (
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <Heart
              size={16}
              fill={savedPhotoIds.has(photo.id) ? 'currentColor' : 'transparent'}
              strokeWidth={savedPhotoIds.has(photo.id) ? 0 : 2.5}
            />
          )}
        </button>

        {/* Photo description */}
        {photo.description && (
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
            {photo.description}
          </p>
        )}

        {/* Photographer */}
        <a
          href={`${photo.user.profile}?utm_source=desayner&utm_medium=referral`}
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
              navigator.clipboard.writeText(photo.urls.regular);
              addToast({ type: 'success', message: 'Image link copied to clipboard!', duration: 2500 });
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
            title="Copy Image Link"
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
export default React.memo(StockPhotoCard);
