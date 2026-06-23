'use client';

import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, X, Loader2, Type, ChevronDown } from 'lucide-react';
import FontCard from '@/components/design-hub/FontCard';
import '../../../App.css';
import './fonts.css';

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: 'all',         label: 'All' },
  { value: 'sans-serif',  label: 'Sans Serif' },
  { value: 'serif',       label: 'Serif' },
  { value: 'display',     label: 'Display' },
  { value: 'handwriting', label: 'Handwriting' },
  { value: 'monospace',   label: 'Monospace' },
];

const QUICK_SEARCHES = [
  'roboto', 'inter', 'playfair', 'montserrat', 'lato',
  'oswald', 'raleway', 'poppins', 'merriweather', 'nunito',
  'ubuntu', 'source sans', 'open sans', 'fira', 'dm sans',
];

const DEFAULT_PREVIEW = 'The quick brown fox';

// Module-level set is intentionally removed — moved to useRef inside component
// to prevent cross-request leaks in SSR environments.

function injectBatch(slugs, injectedSet) {
  const toLoad = slugs.filter(s => !injectedSet.has(s));
  if (!toLoad.length) return;
  // Bunny Fonts supports pipe-separated batch — ONE request for all fonts.
  const families = toLoad.map(s => `${s}:400`).join('|');
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.bunny.net/css?family=${encodeURIComponent(families)}&display=swap`;
  document.head.appendChild(link);
  toLoad.forEach(s => injectedSet.add(s));
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function FontSkeleton() {
  return (
    <>
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="shimmer-box"
          style={{ borderRadius: 10, height: 130 }}
        />
      ))}
    </>
  );
}


// ── Inner page (inside Suspense) ───────────────────────────────────────────────
function FontsInner() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const [query,       setQuery]       = useState(searchParams.get('q')   || '');
  const [category,    setCategory]    = useState(searchParams.get('cat') || 'all');
  const [preview,     setPreview]     = useState(DEFAULT_PREVIEW);
  const [fonts,       setFonts]       = useState([]);
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(1);
  const [hasMore,     setHasMore]     = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadedSlugs, setLoadedSlugs] = useState(new Set());
  // useRef so the injected-slugs set survives re-renders without being
  // module-scoped (which would leak across SSR requests in a Node.js environment).
  const injectedSlugsRef = useRef(new Set());


  const debounceRef  = useRef(null);
  const inputRef     = useRef(null);

  // ── fetch ──────────────────────────────────────────────────────────────────
  const doFetch = useCallback(async (q, cat, p, append = false) => {
    if (p === 1) { setLoading(true); if (!append) setFonts([]); }
    else setLoadingMore(true);

    try {
      const params = new URLSearchParams({ page: String(p) });
      if (q)           params.set('q', q);
      if (cat !== 'all') params.set('category', cat);

      const res  = await fetch(`/api/fonts?${params}`);
      const data = await res.json();
      const incoming = data.fonts || [];

      setFonts(prev => (append ? [...prev, ...incoming] : incoming));
      setTotal(data.total || 0);
      setHasMore(data.hasMore || false);
      setPage(p);

      // Batch inject preview CSS (Bunny CDN, not our server)
      const slugs = incoming.map(f => f.slug);
      if (slugs.length) {
        injectBatch(slugs, injectedSlugsRef.current);
        setLoadedSlugs(prev => {
          const next = new Set(prev);
          slugs.forEach(s => next.add(s));
          return next;
        });
      }
    } catch (err) {
      console.error('[Fonts] fetch error:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Initial load
  useEffect(() => { doFetch(query, category, 1); }, []); // eslint-disable-line

  // ── handlers ───────────────────────────────────────────────────────────────
  function handleQueryChange(e) {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      pushURL(q, category);
      doFetch(q, category, 1);
    }, 600);
  }

  function handleClear() {
    setQuery('');
    pushURL('', category);
    doFetch('', category, 1);
    inputRef.current?.focus();
  }

  function handleQuickSearch(tag) {
    setQuery(tag);
    pushURL(tag, category);
    doFetch(tag, category, 1);
  }

  function handleCategory(cat) {
    setCategory(cat);
    setPage(1);
    pushURL(query, cat);
    doFetch(query, cat, 1);
  }

  function handleLoadMore() {
    const next = page + 1;
    doFetch(query, category, next, true);
  }

  function pushURL(q, cat) {
    const p = new URLSearchParams();
    if (q)            p.set('q',   q);
    if (cat !== 'all') p.set('cat', cat);
    router.replace(`/fonts?${p.toString()}`, { scroll: false });
  }

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>

      {/* ── Hero ── */}
      <div style={{
        position: 'relative',
        background: '#f8f8f8',
        padding: '5rem 1.5rem',
        textAlign: 'center',
        borderBottom: '1px solid #f0f0f0',
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 800, color: '#0d0c22', marginBottom: '1rem', lineHeight: 1.1, letterSpacing: '-0.03em' }}>
            Browse &amp; Download Fonts
          </h1>
          <p style={{ color: '#6e6d7a', fontSize: '1.125rem', marginBottom: '2.5rem', fontWeight: 400, maxWidth: 600, margin: '0 auto 2.5rem' }}>
            {total > 0
              ? <><strong style={{ color: '#0d0c22' }}>{total.toLocaleString()}</strong> free fonts · Download direct from Google</>
              : 'Thousands of free fonts · Download from Google Fonts'}
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
            onChange={handleQueryChange}
            onKeyDown={e => e.key === 'Enter' && doFetch(query, category, 1)}
            placeholder="Search fonts — e.g. Roboto, Playfair..."
            style={{
              flex: 1, border: 'none', outline: 'none',
              padding: '1.25rem 1rem',
              fontSize: '1rem', fontFamily: 'inherit',
              background: 'transparent', color: '#0d0c22',
              fontWeight: 500,
            }}
          />
          {query && (
            <button onClick={handleClear} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0.75rem', color: '#9e9ea7', display: 'flex', alignItems: 'center' }}>
              <X size={18} strokeWidth={2.5} />
            </button>
          )}
          <button
            onClick={() => doFetch(query, category, 1)}
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
              onClick={() => handleQuickSearch(tag)}
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

      {/* ── Filter bar ── */}
      <div style={{
        background: '#ffffff', borderBottom: '1px solid #f0f0f0',
        padding: '1rem 1.5rem',
        display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
      }}>
        {/* LEFT: result count + preview input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0d0c22', whiteSpace: 'nowrap' }}>
            {loading
              ? 'Loading…'
              : total > 0
                ? `${total.toLocaleString()} fonts${query ? ` for "${query}"` : ''}`
                : ''}
          </span>

          {/* Preview input — left side, always visible */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: '#f8f8f8', border: '1px solid #e7e7e9', borderRadius: 100,
            padding: '0.5rem 1rem', flex: 1, maxWidth: 340,
            transition: 'border-color 0.2s',
          }}
          onMouseOver={e => e.currentTarget.style.borderColor = '#d1d1d4'}
          onMouseOut={e => e.currentTarget.style.borderColor = '#e7e7e9'}>
            <Type size={16} color="#9e9ea7" style={{ flexShrink: 0 }} />
            <input
              type="text"
              value={preview}
              onChange={e => setPreview(e.target.value)}
              placeholder="Type to preview..."
              maxLength={60}
              style={{
                border: 'none', background: 'transparent', outline: 'none',
                fontSize: '0.85rem', color: '#0d0c22', fontFamily: 'inherit',
                width: '100%', fontWeight: 500,
              }}
              aria-label="Font preview text"
            />
            {preview !== DEFAULT_PREVIEW && preview.trim() !== '' && (
              <button
                onClick={() => setPreview(DEFAULT_PREVIEW)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9e9ea7', display: 'flex', padding: 0, flexShrink: 0 }}
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>

        {/* RIGHT: category pills */}
        <div style={{
          display: 'flex', gap: '0.4rem', alignItems: 'center',
          overflowX: 'auto', scrollbarWidth: 'none', maxWidth: '100%',
          paddingBottom: '0.2rem'
        }}>
          <span style={{ fontSize: '0.75rem', color: '#6e6d7a', fontWeight: 600, flexShrink: 0, marginRight: '0.25rem' }}>Category:</span>
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => handleCategory(c.value)}
              style={{
                padding: '0.35rem 0.85rem',
                background: category === c.value ? '#0d0c22' : 'transparent',
                color: category === c.value ? 'white' : '#6e6d7a',
                border: 'none', borderRadius: 100,
                fontSize: '0.8125rem', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
                flexShrink: 0, whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
              onMouseOver={e => {
                if (category !== c.value) e.currentTarget.style.color = '#0d0c22';
              }}
              onMouseOut={e => {
                if (category !== c.value) e.currentTarget.style.color = '#6e6d7a';
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>


      {/* ── Font Grid ── */}
      <div className="fonts-grid-container" style={{ padding: '2rem 1.5rem 4rem', maxWidth: 1600, margin: '0 auto' }}>
        <div className="fonts-grid" style={{
          display: 'grid',
          gap: '1.25rem',
        }}>
          {loading ? (
            <FontSkeleton />
          ) : fonts.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem 2rem' }}>
              <Type size={48} style={{ color: '#d1d5db', marginBottom: '1rem', display: 'block', margin: '0 auto 1rem' }} />
              <p style={{ fontWeight: 800, fontSize: '1.25rem', color: '#231f20', marginBottom: '0.4rem' }}>
                No fonts found for &ldquo;{query}&rdquo;
              </p>
              <p style={{ color: '#9b9b9b', fontSize: '0.9rem' }}>Try a different name or change the category filter.</p>
            </div>
          ) : (
            fonts.map(font => (
              <FontCard
                key={font.slug}
                font={font}
                previewText={preview}
                loaded={loadedSlugs.has(font.slug)}
              />
            ))
          )}
        </div>

        {/* Load more */}
        {!loading && hasMore && (
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              style={{
                padding: '0.75rem 2.5rem',
                background: '#231f20', color: 'white', border: 'none',
                borderRadius: 10, fontWeight: 700, fontSize: '0.9rem',
                cursor: loadingMore ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                opacity: loadingMore ? 0.7 : 1,
              }}
            >
              {loadingMore
                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading…</>
                : <><ChevronDown size={16} /> Load more fonts</>}
            </button>
          </div>
        )}
      </div>

      {/* ── Footer attribution ── */}
      <div style={{
        textAlign: 'center', padding: '1.25rem',
        borderTop: '1px solid #e8e8e8', background: 'white',
      }}>
        <p style={{ fontSize: '0.8rem', color: '#9b9b9b' }}>
          Fonts provided by{' '}
          <a href="https://fonts.bunny.net" target="_blank" rel="noreferrer" style={{ color: '#231f20', fontWeight: 700 }}>
            Bunny Fonts
          </a>
          {' '}· Downloads via{' '}
          <a href="https://fonts.google.com" target="_blank" rel="noreferrer" style={{ color: '#231f20', fontWeight: 700 }}>
            Google Fonts
          </a>
          {' '}· All fonts are free to use under their respective open-source licenses.
        </p>
      </div>


    </div>
  );
}

// ── Page export ────────────────────────────────────────────────────────────────
export default function FontsPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: '4rem', textAlign: 'center', color: '#9b9b9b', fontSize: '0.9rem' }}>
        Loading font explorer…
      </div>
    }>
      <FontsInner />
    </Suspense>
  );
}
