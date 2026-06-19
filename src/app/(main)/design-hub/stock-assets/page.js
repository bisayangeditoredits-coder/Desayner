'use client';
import { useState, useEffect, useRef, useCallback, useMemo} from 'react';
import { Search, X, Loader2, PenTool } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import useToastStore from '@/store/useToastStore';
import Link from 'next/link';
import StockAssetCard from '@/components/design-hub/StockAssetCard';
import '../../../App.css';
import './stock-assets.css';

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
  const addToast = useToastStore((state) => state.addToast);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUser(data.user);
    });
  }, [supabase]);

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

  const loadMoreRef = useRef(null);

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !loadingMore && results.length > 0 && page < totalPages) {
          doSearch(query, page + 1);
        }
      },
      { threshold: 0.1 }
    );
    
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    
    return () => observer.disconnect();
  }, [loading, loadingMore, results.length, page, totalPages, query, doSearch]);

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
        background: '#f8f8f8',
        padding: '5rem 1.5rem',
        textAlign: 'center',
        borderBottom: '1px solid #f0f0f0',
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 800, color: '#0d0c22', marginBottom: '1rem', lineHeight: 1.1, letterSpacing: '-0.03em' }}>
            Free Stock Assets
          </h1>
          <p style={{ color: '#6e6d7a', fontSize: '1.125rem', marginBottom: '2.5rem', fontWeight: 400, maxWidth: 600, margin: '0 auto 2.5rem' }}>
            Thousands of high-quality vector illustrations and design assets. <br/>Powered by Pixabay.
          </p>
        </div>

        {/* Search bar */}
        <div 
          style={{
            position: 'relative', zIndex: 1,
            display: 'flex',
            maxWidth: 660,
            margin: '0 auto',
            background: '#ffffff',
            border: '1px solid #e7e7e9',
            borderRadius: 100,
            overflow: 'hidden',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.04)',
            transition: 'box-shadow 0.2s',
          }}
          onMouseOver={e => e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.08)'}
          onMouseOut={e => e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.04)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '1.5rem' }}>
            <Search size={20} color="#9e9ea7" strokeWidth={2.5} />
          </div>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch(query, 1)}
            placeholder="Search vectors, illustrations, pngs..."
            style={{
              flex: 1, border: 'none', outline: 'none',
              padding: '1.25rem 1rem',
              fontSize: '1rem', fontFamily: 'inherit',
              background: 'transparent', color: '#0d0c22',
              fontWeight: 500,
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0.75rem', color: '#9e9ea7', display: 'flex', alignItems: 'center' }}>
              <X size={18} strokeWidth={2.5} />
            </button>
          )}
          <button
            onClick={() => doSearch(query, 1)}
            style={{
              padding: '0 2rem',
              background: '#2d43e8', // Brand blue
              color: 'white',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.9375rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
              margin: '0.35rem 0.35rem 0.35rem 0',
              borderRadius: 100,
            }}
            onMouseOver={e => e.currentTarget.style.background = '#1f32b8'}
            onMouseOut={e => e.currentTarget.style.background = '#2d43e8'}
          >
            Search
          </button>
        </div>

        {/* Quick search chips */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '1.75rem' }}>
          {QUICK_SEARCHES.map(tag => (
            <button
              key={tag}
              onClick={() => setQuery(tag)}
              style={{
                padding: '0.45rem 1.1rem',
                background: query === tag ? '#0d0c22' : '#ffffff',
                color: query === tag ? 'white' : '#6e6d7a',
                border: query === tag ? '1px solid #0d0c22' : '1px solid #e7e7e9',
                borderRadius: 100,
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.2s',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              }}
              onMouseOver={e => {
                if (query !== tag) {
                  e.currentTarget.style.borderColor = '#d1d1d4';
                  e.currentTarget.style.color = '#0d0c22';
                }
              }}
              onMouseOut={e => {
                if (query !== tag) {
                  e.currentTarget.style.borderColor = '#e7e7e9';
                  e.currentTarget.style.color = '#6e6d7a';
                }
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* ── Filters bar ─────────────────────────────────────────────────── */}
      <div style={{
        background: '#ffffff',
        borderBottom: '1px solid #f0f0f0',
        padding: '1rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0d0c22' }}>
          {loading ? 'Searching…' : total > 0 ? `${total.toLocaleString()} vectors for "${query}"` : ''}
        </span>
      </div>

      {/* ── Photo Grid ──────────────────────────────────────────────────── */}
      <div style={{ padding: '2rem 1.5rem 4rem', maxWidth: 1600, margin: '0 auto' }}>

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
          columns: 'clamp(240px, 22vw, 320px)',
          columnGap: '1.25rem',
        }}>
          {loading ? (
            <div style={{ columns: 'unset', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
              <VectorSkeleton />
            </div>
          ) : (
            results.map((photo, index) => (
              <StockAssetCard
                key={photo.id}
                photo={photo}
                onDownload={handleDownload}
                dlId={dlId}
                dlDone={dlDone}
                priority={index < 4}
              />
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
          <div ref={loadMoreRef} style={{ textAlign: 'center', marginTop: '2rem', paddingBottom: '2rem' }}>
            {loadingMore && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#6e6d7a', fontWeight: 600 }}>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading more vectors...
              </div>
            )}
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


    </div>
  );
}
