'use client';
import { useState, useEffect, useRef, useCallback, useMemo} from 'react';
import { Search, Download, X, Loader2, ExternalLink, ImageIcon, ChevronDown, Check, Heart, Link as LinkIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import useToastStore from '@/store/useToastStore';
import Link from 'next/link';
import { unsplashImageSrc } from '@/lib/utils';
import '../../../App.css';

const QUICK_SEARCHES = [
  'minimal design', 'dark background', 'colorful abstract',
  'typography', 'gradient', 'nature', 'architecture',
  'workspace', 'mockup', 'texture', 'geometric', 'neon',
];

const ORIENTATIONS = [
  { value: '', label: 'All' },
  { value: 'landscape', label: 'Landscape' },
  { value: 'portrait', label: 'Portrait' },
  { value: 'squarish', label: 'Square' },
];

function PhotoSkeleton() {
  return (
    <>
      {[...Array(16)].map((_, i) => (
        <div
          key={i}
          className="shimmer-box"
          style={{
            borderRadius: 8,
            height: [180, 240, 200, 220, 160, 280, 200, 180, 260, 200, 240, 180, 220, 200, 260, 180][i] || 200,
          }}
        />
      ))}
    </>
  );
}

export default function StockPhotosPage() {
  const [query, setQuery]           = useState('design');
  const [orientation, setOrientation] = useState('');
  const [results, setResults]       = useState([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading]       = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [dlId, setDlId]             = useState(null);
  const [dlDone, setDlDone]         = useState(null);
  const [error, setError]           = useState(null);
  
  const [user, setUser] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [savedPhotoIds, setSavedPhotoIds] = useState(new Set());
  
  const supabase = useMemo(() => createClient(), []);
  const addToast = useToastStore((state) => state.addToast);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUser(data.user);
    });
  }, []);

  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  const doSearch = useCallback(async (q, p = 1, orient = orientation) => {
    if (!q.trim()) return;
    if (p === 1) { setLoading(true); setResults([]); }
    else setLoadingMore(true);
    setError(null);

    try {
      const params = new URLSearchParams({ q, page: String(p) });
      if (orient) params.set('orientation', orient);
      const res  = await fetch(`/api/unsplash/search?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed');
      if (p === 1) setResults(data.results || []);
      else setResults(prev => [...prev, ...(data.results || [])]);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 0);
      setPage(p);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [orientation]);

  // Initial load + debounced re-search on query change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query, 1, orientation), 400);
    return () => clearTimeout(debounceRef.current);
  }, [query, orientation]);

  const handleDownload = async (photo) => {
    setDlId(photo.id);
    setDlDone(null);
    try {
      // 1. Trigger Unsplash download tracking (required by their API guidelines)
      const res  = await fetch('/api/unsplash/download', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ downloadLocation: photo.urls.download }),
      });
      const data = await res.json();

      // 2. Open the full-resolution download URL
      const link = document.createElement('a');
      link.href     = data.downloadUrl || photo.urls.full;
      link.download = `unsplash-${photo.id}-by-${photo.user.username}.jpg`;
      link.target   = '_blank';
      link.rel      = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDlDone(photo.id);
      setTimeout(() => setDlDone(null), 2500);
    } catch (err) {
      console.error('[Stock Photos download error]', err);
    } finally {
      setDlId(null);
    }
  };

  const toggleSave = async (photo) => {
    if (!user) {
      addToast({
        type: 'error',
        title: 'Authentication Required',
        message: 'Please log in to save photos to your moodboard.',
        duration: 4000,
        link: `/login?redirect=/stock-photos`
      });
      return;
    }
    setSavingId(photo.id);
    try {
      const res = await fetch('/api/unsplash/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          photo_id: photo.id,
          photo_url: photo.urls.regular,
          photographer_name: photo.user.name
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSavedPhotoIds(prev => {
        const next = new Set(prev);
        if (data.saved) next.add(photo.id);
        else next.delete(photo.id);
        return next;
      });
    } catch (err) {
      console.error('Failed to save photo', err);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>

      {/* ── Hero / Search Header ────────────────────────────────────────── */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #2d43e8 0%, #0006a8 60%, #000473 100%)',
        padding: '2.5rem 1.5rem',
        textAlign: 'center',
        overflow: 'hidden',
      }}>
        {/* Photo Watermark Overlay */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: 'url("https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.15,
          mixBlendMode: 'overlay',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            Powered by Unsplash · Free to download & use
          </p>
          <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 900, color: 'white', marginBottom: '0.5rem', lineHeight: 1.15 }}>
            Free Stock Photos
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', marginBottom: '2rem' }}>
            Millions of high-resolution photos, free for personal &amp; commercial use.
          </p>
        </div>

        {/* Search bar */}
        <div style={{
          position: 'relative', zIndex: 1,
          display: 'flex',
          maxWidth: 660,
          margin: '0 auto',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '1.1rem' }}>
            <Search size={18} color="rgba(255, 255, 255, 0.8)" />
          </div>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch(query, 1, orientation)}
            placeholder="Search free high-resolution photos..."
            style={{
              flex: 1, border: 'none', outline: 'none',
              padding: '1rem 0.75rem',
              fontSize: '1rem', fontFamily: 'inherit',
              background: 'transparent', color: 'white',
            }}
            className="placeholder-white-dim"
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0.75rem', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center' }}>
              <X size={16} />
            </button>
          )}
          <button
            onClick={() => doSearch(query, 1, orientation)}
            style={{
              padding: '0 1.5rem',
              background: 'rgba(255,255,255,0.95)',
              color: '#1a1a1a',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.875rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
            }}
            onMouseOver={e => e.currentTarget.style.background = 'white'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.95)'}
          >
            Search
          </button>
        </div>

        {/* Quick search chips */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '1.25rem' }}>
          {QUICK_SEARCHES.map(tag => (
            <button
              key={tag}
              onClick={() => setQuery(tag)}
              style={{
                padding: '0.3rem 0.85rem',
                background: query === tag ? 'white' : 'rgba(255,255,255,0.1)',
                color: query === tag ? '#231f20' : 'rgba(255,255,255,0.75)',
                border: query === tag ? 'none' : '1px solid rgba(255,255,255,0.15)',
                borderRadius: 20,
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* ── Filters bar ─────────────────────────────────────────────────── */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e8e8e8',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6b6b6b' }}>
          {loading ? 'Searching…' : total > 0 ? `${total.toLocaleString()} photos for "${query}"` : ''}
        </span>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: '#9b9b9b', fontWeight: 600 }}>Orientation:</span>
          {ORIENTATIONS.map(o => (
            <button
              key={o.value}
              onClick={() => setOrientation(o.value)}
              style={{
                padding: '0.3rem 0.75rem',
                background: orientation === o.value ? '#231f20' : '#f5f5f5',
                color: orientation === o.value ? 'white' : '#6b6b6b',
                border: 'none',
                borderRadius: 6,
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Photo Grid ──────────────────────────────────────────────────── */}
      <div style={{ padding: '1.5rem 1.5rem 3rem' }}>

        {error && (
          <div style={{
            padding: '1rem 1.5rem',
            background: '#fff5f5',
            border: '1px solid #fecaca',
            borderRadius: 8,
            color: '#dc2626',
            marginBottom: '1.5rem',
          }}>
            ⚠️ {error} — Make sure UNSPLASH_ACCESS_KEY is set in .env.local
          </div>
        )}

        {/* Masonry grid */}
        <div style={{
          columns: 'clamp(200px, 22vw, 300px)',
          columnGap: '0.75rem',
        }}>
          {loading ? (
            <div style={{ columns: 'unset', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
              <PhotoSkeleton />
            </div>
          ) : (
            results.map(photo => (
              <div
                key={photo.id}
                style={{
                  breakInside: 'avoid',
                  marginBottom: '0.75rem',
                  borderRadius: 10,
                  overflow: 'hidden',
                  position: 'relative',
                  background: photo.color || '#f0f0f0',
                  cursor: 'default',
                }}
                className="stock-photo-card"
              >
                <img
                  src={unsplashImageSrc(photo.urls.small)}
                  alt={photo.description || `Photo by ${photo.user.name}`}
                  loading="lazy"
                  decoding="async"
                  style={{ width: '100%', display: 'block' }}
                />

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
                    onClick={() => toggleSave(photo)}
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
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                    title={savedPhotoIds.has(photo.id) ? "Remove from Moodboard" : "Save to Moodboard"}
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
                        handleDownload(photo);
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
            ))
          )}
        </div>

        {/* Empty state */}
        {!loading && results.length === 0 && !error && (
          <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
            <ImageIcon size={48} style={{ color: '#d1d5db', marginBottom: '1rem' }} />
            <p style={{ fontWeight: 800, fontSize: '1.25rem', color: '#231f20', marginBottom: '0.4rem' }}>
              No photos found for &ldquo;{query}&rdquo;
            </p>
            <p style={{ color: '#9b9b9b', fontSize: '0.9rem' }}>Try a different keyword</p>
          </div>
        )}

        {/* Load more */}
        {results.length > 0 && page < totalPages && (
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button
              onClick={() => doSearch(query, page + 1)}
              disabled={loadingMore}
              style={{
                padding: '0.75rem 2.5rem',
                background: '#231f20',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: loadingMore ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                opacity: loadingMore ? 0.7 : 1,
              }}
            >
              {loadingMore
                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading…</>
                : <><ChevronDown size={16} /> Load more photos</>
              }
            </button>
          </div>
        )}
      </div>

      {/* ── Footer attribution (required by Unsplash) ───────────────────── */}
      <div style={{
        textAlign: 'center',
        padding: '1.25rem',
        borderTop: '1px solid #e8e8e8',
        background: 'white',
      }}>
        <p style={{ fontSize: '0.8rem', color: '#9b9b9b' }}>
          Photos provided by{' '}
          <a
            href="https://unsplash.com/?utm_source=desayner&utm_medium=referral"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#231f20', fontWeight: 700, textDecoration: 'none' }}
          >
            Unsplash
          </a>
          {' '}· All photos are free to download and use for personal &amp; commercial projects.
        </p>
      </div>

      <style>{`
        .placeholder-white-dim::placeholder {
          color: rgba(255, 255, 255, 0.6);
        }
        .stock-photo-card {
          transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.3s ease;
        }
        .stock-photo-card:hover { 
          transform: scale(1.02);
          box-shadow: 0 12px 32px rgba(0,0,0,0.15);
          z-index: 10;
        }
        .stock-photo-card:hover .stock-photo-overlay { opacity: 1 !important; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
