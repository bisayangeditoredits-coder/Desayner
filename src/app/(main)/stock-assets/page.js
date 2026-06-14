'use client';
import { useState, useEffect, useRef, useCallback, useMemo} from 'react';
import { Search, Download, X, Loader2, ExternalLink, Box, ChevronDown, Check, PenTool } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import '../../App.css';

const QUICK_SEARCHES = [
  'floral pattern', 'abstract shape', 'minimalist vector',
  'typography', 'gradient mesh', 'nature illustration', 'office vector',
  '3d element', 'mockup', 'texture', 'geometric', 'neon sign',
];

function VectorSkeleton() {
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

export default function StockAssetsPage() {
  const [query, setQuery]           = useState('design');
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
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUser(data.user);
    });
  }, []);

  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  const doSearch = useCallback(async (q, p = 1) => {
    if (!q.trim()) return;
    if (p === 1) { setLoading(true); setResults([]); }
    else setLoadingMore(true);
    setError(null);

    try {
      const params = new URLSearchParams({ q, page: String(p), type: 'vector' });
      const res  = await fetch(`/api/pixabay/search?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed');
      if (p === 1) {
        setResults(data.results || []);
      } else {
        setResults(prev => {
          const existingIds = new Set(prev.map(item => item.id));
          const uniqueNewItems = (data.results || []).filter(item => !existingIds.has(item.id));
          return [...prev, ...uniqueNewItems];
        });
      }
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 0);
      setPage(p);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Initial load + debounced re-search on query change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query, 1), 400);
    return () => clearTimeout(debounceRef.current);
  }, [query, doSearch]);

  const handleDownload = async (photo) => {
    setDlId(photo.id);
    setDlDone(null);
    try {
      const res  = await fetch(`/api/pixabay/image?url=${encodeURIComponent(photo.urls.large)}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href     = url;
      link.download = `vector-${photo.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setDlDone(photo.id);
      setTimeout(() => setDlDone(null), 2500);
    } catch (err) {
      console.error('[Stock Assets download error]', err);
    } finally {
      setDlId(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>

      {/* ── Hero / Search Header ────────────────────────────────────────── */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #e82d8c 0%, #a8005b 60%, #73003b 100%)',
        padding: '2.5rem 1.5rem',
        textAlign: 'center',
        overflow: 'hidden',
      }}>
        {/* Subtle pattern background overlay */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0, opacity: 0.1,
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            Powered by Pixabay · Free vectors & illustrations
          </p>
          <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 900, color: 'white', marginBottom: '0.5rem', lineHeight: 1.15 }}>
            Free Stock Assets
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', marginBottom: '2rem' }}>
            Thousands of high-quality vector illustrations and design assets.
          </p>
        </div>

        {/* Search bar */}
        <div style={{
          position: 'relative', zIndex: 1,
          display: 'flex',
          maxWidth: 660,
          margin: '0 auto',
          background: 'white',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(232, 45, 140,0.25)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '1.1rem' }}>
            <Search size={18} color="#9b9b9b" />
          </div>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch(query, 1)}
            placeholder="Search vectors, illustrations, pngs..."
            style={{
              flex: 1, border: 'none', outline: 'none',
              padding: '1rem 0.75rem',
              fontSize: '1rem', fontFamily: 'inherit',
              background: 'transparent', color: '#231f20',
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0.75rem', color: '#9b9b9b', display: 'flex', alignItems: 'center' }}>
              <X size={16} />
            </button>
          )}
          <button
            onClick={() => doSearch(query, 1)}
            style={{
              padding: '0 1.5rem',
              background: '#e6e82d',
              color: '#231f20',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.875rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
              transition: 'background 0.15s',
            }}
            onMouseOver={e => e.currentTarget.style.background = '#d4d626'}
            onMouseOut={e => e.currentTarget.style.background = '#e6e82d'}
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
          {loading ? 'Searching…' : total > 0 ? `${total.toLocaleString()} vectors for "${query}"` : ''}
        </span>
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
            ⚠️ {error} — Make sure PIXABAY_API_KEY is set in .env.local
          </div>
        )}

        {/* Masonry grid */}
        <div style={{
          columns: 'clamp(200px, 22vw, 300px)',
          columnGap: '0.75rem',
        }}>
          {loading ? (
            <div style={{ columns: 'unset', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
              <VectorSkeleton />
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
                  background: 'white',
                  border: '1px solid #e8e8e8',
                  cursor: 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1rem',
                }}
                className="stock-photo-card"
              >
                {/* Checkerboard background for transparency indication */}
                <div style={{
                  position: 'absolute', inset: 0, zIndex: 0, opacity: 0.4,
                  backgroundImage: 'repeating-linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%, #f0f0f0), repeating-linear-gradient(45deg, #f0f0f0 25%, #ffffff 25%, #ffffff 75%, #f0f0f0 75%, #f0f0f0)',
                  backgroundPosition: '0 0, 10px 10px',
                  backgroundSize: '20px 20px',
                }} />

                <img
                  src={`/api/pixabay/image?url=${encodeURIComponent(photo.urls.webformat)}`}
                  alt={photo.tags || `Vector by ${photo.user.name}`}
                  loading="lazy"
                  style={{ width: '100%', display: 'block', position: 'relative', zIndex: 1 }}
                />

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

                  {/* Download button */}
                  <button
                    onClick={() => handleDownload(photo)}
                    disabled={dlId === photo.id}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      background: dlDone === photo.id ? '#16a34a' : 'white',
                      color: dlDone === photo.id ? 'white' : '#231f20',
                      border: 'none',
                      borderRadius: 7,
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: dlId === photo.id ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      transition: 'background 0.2s',
                    }}
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
            ))
          )}
        </div>

        {/* Empty state */}
        {!loading && results.length === 0 && !error && (
          <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
            <PenTool size={48} style={{ color: '#d1d5db', marginBottom: '1rem' }} />
            <p style={{ fontWeight: 800, fontSize: '1.25rem', color: '#231f20', marginBottom: '0.4rem' }}>
              No vectors found for &ldquo;{query}&rdquo;
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
                : <><ChevronDown size={16} /> Load more vectors</>
              }
            </button>
          </div>
        )}
      </div>

      {/* ── Footer attribution ───────────────────── */}
      <div style={{
        textAlign: 'center',
        padding: '1.25rem',
        borderTop: '1px solid #e8e8e8',
        background: 'white',
      }}>
        <p style={{ fontSize: '0.8rem', color: '#9b9b9b' }}>
          Vectors & Illustrations provided by{' '}
          <a
            href="https://pixabay.com/?utm_source=desayner&utm_medium=referral"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#231f20', fontWeight: 700, textDecoration: 'none' }}
          >
            Pixabay
          </a>
          {' '}· All assets are free to download and use.
        </p>
      </div>

      <style>{`
        .stock-photo-card:hover .stock-photo-overlay { opacity: 1 !important; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
