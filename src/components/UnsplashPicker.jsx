'use client';
/**
 * UnsplashPicker
 *
 * A searchable photo picker that lets users:
 *  1. Search Unsplash stock photos
 *  2. "Use as Cover" — fetches the photo as a blob and passes it
 *     to the parent's upload pipeline (reuses existing CoverEditor flow)
 *  3. "Download" — triggers Unsplash download tracking then opens
 *     the full-res photo in a new tab for the user to save locally
 *
 * Props:
 *   onSelectPhoto(blob, previewUrl) — called when user picks "Use as Cover"
 *   onClose()                       — called when user dismisses the picker
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Download, Image as ImageIcon, X, Loader2, ExternalLink, ChevronRight } from 'lucide-react';

// ── Inline shimmer keyframes ──────────────────────────────────────────────────
const shimmerStyle = `
  @keyframes unsplash-shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  .u-shimmer {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 800px 100%;
    animation: unsplash-shimmer 1.4s infinite;
  }
`;

function PhotoSkeleton() {
  return (
    <div style={{ display: 'contents' }}>
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="u-shimmer"
          style={{
            borderRadius: 6,
            aspectRatio: i % 3 === 0 ? '4/3' : i % 3 === 1 ? '3/4' : '1/1',
            minHeight: 100,
          }}
        />
      ))}
    </div>
  );
}

export default function UnsplashPicker({ onSelectPhoto, onClose }) {
  const [query,       setQuery]       = useState('');
  const [results,     setResults]     = useState([]);
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(0);
  const [loading,     setLoading]     = useState(false);
  const [usingId,     setUsingId]     = useState(null);   // photo being used as cover
  const [dlId,        setDlId]        = useState(null);   // photo being downloaded
  const [error,       setError]       = useState(null);
  const debounceRef   = useRef(null);
  const inputRef      = useRef(null);

  // Focus search on open
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  // ── Debounced search ────────────────────────────────────────────────────────
  const doSearch = useCallback(async (q, p = 1) => {
    if (!q.trim()) { setResults([]); setTotal(0); return; }
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`/api/unsplash/search?q=${encodeURIComponent(q)}&page=${p}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed');
      if (p === 1) setResults(data.results || []);
      else setResults(prev => [...prev, ...(data.results || [])]);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query, 1), 400);
    return () => clearTimeout(debounceRef.current);
  }, [query, doSearch]);

  const updateQuery = useCallback((nextQuery) => {
    setPage(1);
    setQuery(nextQuery);
  }, []);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    doSearch(query, next);
  };

  // ── Use as Cover ────────────────────────────────────────────────────────────
  const handleUse = async (photo) => {
    setUsingId(photo.id);
    try {
      // Fetch the regular-size photo as a blob (good quality, not too heavy)
      const res  = await fetch(photo.urls.regular);
      const blob = await res.blob();
      const file = new File([blob], `unsplash-${photo.id}.jpg`, { type: blob.type });
      onSelectPhoto(file, photo.urls.regular);
    } catch (err) {
      console.error('[UnsplashPicker use error]', err);
    } finally {
      setUsingId(null);
    }
  };

  // ── Download to computer ────────────────────────────────────────────────────
  const handleDownload = async (photo) => {
    setDlId(photo.id);
    try {
      // 1. Trigger Unsplash download tracking (required by their guidelines)
      const res  = await fetch('/api/unsplash/download', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ downloadLocation: photo.urls.download }),
      });
      const data = await res.json();

      // 2. Open the full-res download URL in a new tab
      const link = document.createElement('a');
      link.href     = data.downloadUrl || photo.urls.full;
      link.download = `unsplash-${photo.id}.jpg`;
      link.target   = '_blank';
      link.rel      = 'noopener';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('[UnsplashPicker download error]', err);
    } finally {
      setDlId(null);
    }
  };

  return (
    <>
      <style>{shimmerStyle}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(3px)',
          zIndex: 1000,
        }}
      />

      {/* Panel */}
      <div style={{
        position:  'fixed',
        top:       '50%',
        left:      '50%',
        transform: 'translate(-50%, -50%)',
        width:     'min(900px, 96vw)',
        maxHeight: '88vh',
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
        display:  'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex:   1001,
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '1.1rem 1.5rem',
          borderBottom: '1px solid #f0f0f0',
          background: '#fafafa',
          flexShrink: 0,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            flex: 1,
            background: 'white',
            border: '1.5px solid #e0e0e0',
            borderRadius: 8,
            padding: '0.5rem 0.85rem',
          }}>
            <Search size={16} color="#9b9b9b" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => updateQuery(e.target.value)}
              placeholder="Search millions of free photos..."
              style={{
                flex: 1, border: 'none', outline: 'none',
                fontSize: '0.9rem', fontFamily: 'inherit',
                background: 'transparent', color: '#231f20',
              }}
            />
            {query && (
              <button
                onClick={() => updateQuery('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#9b9b9b', display: 'flex' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {total > 0 && !loading && (
            <span style={{ fontSize: '0.78rem', color: '#9b9b9b', whiteSpace: 'nowrap' }}>
              {total.toLocaleString()} photos
            </span>
          )}

          <button
            onClick={onClose}
            style={{
              background: '#f0f0f0', border: 'none', borderRadius: 8,
              width: 34, height: 34, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Quick search chips */}
        <div style={{
          display: 'flex', gap: '0.4rem', flexWrap: 'wrap',
          padding: '0.75rem 1.5rem',
          borderBottom: '1px solid #f5f5f5',
          flexShrink: 0,
        }}>
          {['minimal', 'dark background', 'colorful', 'abstract', 'nature', 'architecture', 'typography', 'gradient'].map(tag => (
            <button
              key={tag}
              onClick={() => updateQuery(tag)}
              style={{
                padding: '0.3rem 0.75rem',
                background: query === tag ? '#231f20' : '#f0f0f0',
                color: query === tag ? 'white' : '#6b6b6b',
                border: 'none', borderRadius: 20,
                fontSize: '0.75rem', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Photo grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }}>

          {/* Empty state */}
          {!query && !loading && results.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem 2rem', color: '#9b9b9b' }}>
              <ImageIcon size={40} style={{ marginBottom: '0.75rem', opacity: 0.3 }} />
              <p style={{ fontWeight: 700, color: '#231f20', marginBottom: '0.35rem' }}>Search Unsplash</p>
              <p style={{ fontSize: '0.875rem' }}>Millions of free high-quality photos</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              padding: '1rem 1.25rem', background: '#fff5f5', border: '1px solid #fecaca',
              borderRadius: 8, color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem',
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Grid */}
          <div style={{
            columns: '3 200px', columnGap: '0.6rem',
          }}>
            {loading && results.length === 0 ? (
              <div style={{ columns: 'unset', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
                <PhotoSkeleton />
              </div>
            ) : (
              results.map(photo => (
                <div
                  key={photo.id}
                  style={{
                    breakInside: 'avoid',
                    marginBottom: '0.6rem',
                    borderRadius: 8,
                    overflow: 'hidden',
                    position: 'relative',
                    background: photo.color || '#f0f0f0',
                    cursor: 'pointer',
                  }}
                  className="unsplash-photo-card"
                >
                  <img
                    src={photo.urls.small}
                    alt={photo.description}
                    loading="lazy"
                    style={{ width: '100%', display: 'block' }}
                  />

                  {/* Hover overlay */}
                  <div className="unsplash-overlay" style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 50%)',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: '0.75rem',
                    gap: '0.4rem',
                  }}>
                    {/* Photographer attribution */}
                    <a
                      href={`${photo.user.profile}?utm_source=desayner&utm_medium=referral`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{
                        fontSize: '0.68rem', color: 'rgba(255,255,255,0.85)',
                        textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem',
                      }}
                    >
                      <ExternalLink size={9} />
                      {photo.user.name} on Unsplash
                    </a>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        onClick={() => handleUse(photo)}
                        disabled={!!usingId}
                        style={{
                          flex: 1,
                          padding: '0.45rem 0.6rem',
                          background: 'white',
                          color: '#231f20',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: usingId ? 'not-allowed' : 'pointer',
                          fontFamily: 'inherit',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.3rem',
                          opacity: usingId && usingId !== photo.id ? 0.5 : 1,
                        }}
                      >
                        {usingId === photo.id
                          ? <><Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> Loading…</>
                          : <>Use as Cover</>
                        }
                      </button>

                      <button
                        onClick={() => handleDownload(photo)}
                        disabled={dlId === photo.id}
                        title="Download full resolution"
                        style={{
                          padding: '0.45rem 0.6rem',
                          background: 'rgba(255,255,255,0.2)',
                          color: 'white',
                          border: '1px solid rgba(255,255,255,0.4)',
                          borderRadius: 6,
                          cursor: dlId === photo.id ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {dlId === photo.id
                          ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                          : <Download size={13} />
                        }
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Load more */}
          {results.length > 0 && page < totalPages && !loading && (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <button
                onClick={loadMore}
                style={{
                  padding: '0.6rem 2rem',
                  background: '#231f20',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                Load more <ChevronRight size={14} />
              </button>
            </div>
          )}

          {loading && results.length > 0 && (
            <div style={{ textAlign: 'center', padding: '1rem', color: '#9b9b9b' }}>
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          )}
        </div>

        {/* Footer attribution */}
        <div style={{
          padding: '0.6rem 1.5rem',
          borderTop: '1px solid #f0f0f0',
          background: '#fafafa',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <a
            href="https://unsplash.com/?utm_source=desayner&utm_medium=referral"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '0.72rem', color: '#9b9b9b', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            Photos provided by <strong style={{ color: '#231f20' }}>Unsplash</strong>
          </a>
        </div>
      </div>

      <style>{`
        .unsplash-photo-card:hover .unsplash-overlay { opacity: 1 !important; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
