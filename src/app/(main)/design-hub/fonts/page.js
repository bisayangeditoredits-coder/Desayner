'use client';

import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Download, X, Loader2, Type, ChevronDown, Check } from 'lucide-react';
import '../../../App.css';

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

// ── Font Card ─────────────────────────────────────────────────────────────────
function FontCard({ font, previewText, loaded }) {
  const displayText = previewText.trim() || DEFAULT_PREVIEW;
  const downloadUrl = `https://fonts.google.com/download?family=${encodeURIComponent(font.name)}`;

  const CAT_COLORS = {
    'serif':       { bg: '#fef3c7', color: '#92400e' },
    'sans-serif':  { bg: '#e0f2fe', color: '#0369a1' },
    'display':     { bg: '#ede9fe', color: '#6d28d9' },
    'handwriting': { bg: '#fce7f3', color: '#9d174d' },
    'monospace':   { bg: '#d1fae5', color: '#065f46' },
  };
  const catStyle = CAT_COLORS[font.category] || { bg: '#f3f4f6', color: '#374151' };

  return (
    <div
      className="font-card-item"
      style={{
        background: 'white',
        border: '1px solid #e8e8e8',
        borderRadius: 10,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.2s, border-color 0.18s',
      }}
    >
      {/* Header row */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: '0.85rem 1rem 0.5rem',
        gap: '0.75rem',
      }}>
        {/* Left: name + meta */}
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{
            margin: '0 0 0.25rem',
            fontSize: '0.82rem',
            fontWeight: 700,
            color: '#231f20',
            fontFamily: 'var(--font-grotesk, inherit)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {font.name}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{
              fontSize: '0.62rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: catStyle.color,
              background: catStyle.bg,
              padding: '0.1rem 0.45rem',
              borderRadius: 4,
            }}>
              {font.category}
            </span>
            <span style={{ fontSize: '0.68rem', color: '#9b9b9b', fontWeight: 500 }}>
              {font.styles.length} style{font.styles.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Right: download button */}
        <a
          href={downloadUrl}
          target="_blank"
          rel="noreferrer noopener"
          title={`Download ${font.name}`}
          onClick={e => e.stopPropagation()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.38rem 0.75rem',
            background: '#231f20',
            color: 'white',
            borderRadius: 6,
            fontSize: '0.72rem',
            fontWeight: 700,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            fontFamily: 'var(--font-grotesk, inherit)',
            transition: 'background 0.15s',
          }}
          onMouseOver={e => e.currentTarget.style.background = '#2d43e8'}
          onMouseOut={e => e.currentTarget.style.background = '#231f20'}
        >
          <Download size={11} />
          Download
        </a>
      </div>

      {/* Preview text */}
      <div
        style={{
          padding: '0.25rem 1rem 1rem',
          fontSize: '1.55rem',
          color: '#0f172a',
          lineHeight: 1.35,
          wordBreak: 'break-word',
          minHeight: 68,
          display: 'flex',
          alignItems: 'center',
          fontFamily: loaded ? `'${font.name}', sans-serif` : 'inherit',
          transition: 'font-family 0.2s ease',
          borderTop: '1px solid #f3f4f6',
        }}
        aria-label={`${font.name} preview`}
      >
        {displayText}
      </div>
    </div>
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
    }, 380);
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
        background: 'linear-gradient(135deg, #2d43e8 0%, #0006a8 60%, #000473 100%)',
        padding: '2.5rem 1.5rem',
        textAlign: 'center',
        overflow: 'hidden',
      }}>
        {/* Subtle text-art watermark */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 'clamp(6rem, 18vw, 14rem)',
          fontWeight: 900,
          color: 'rgba(255,255,255,0.04)',
          letterSpacing: '-0.05em',
          userSelect: 'none',
          pointerEvents: 'none',
          fontFamily: 'var(--font-display, inherit)',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}>
          Aa Bb Cc
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{
            fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.15em',
            color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase',
            marginBottom: '0.75rem', fontFamily: 'var(--font-grotesk, inherit)',
          }}>
            Powered by Bunny Fonts · Free to download &amp; use
          </p>
          <h1 style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 900,
            color: 'white', marginBottom: '0.5rem', lineHeight: 1.15,
          }}>
            Browse &amp; Download Fonts
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1rem', marginBottom: '2rem' }}>
            {total > 0
              ? <><strong style={{ color: 'white' }}>{total.toLocaleString()}</strong> free fonts · download direct from Google</>
              : 'Thousands of free fonts · Download from Google Fonts'}
          </p>
        </div>

        {/* Search bar — same shape as stock photos */}
        <div style={{
          position: 'relative', zIndex: 1,
          display: 'flex', maxWidth: 660, margin: '0 auto',
          background: 'white', borderRadius: 12, overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(45, 67, 232,0.25)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '1.1rem' }}>
            <Search size={18} color="#9b9b9b" />
          </div>
          <input
            ref={inputRef}
            value={query}
            onChange={handleQueryChange}
            onKeyDown={e => e.key === 'Enter' && doFetch(query, category, 1)}
            placeholder="Search fonts — e.g. Roboto, Playfair, Inter…"
            style={{
              flex: 1, border: 'none', outline: 'none',
              padding: '1rem 0.75rem', fontSize: '1rem',
              fontFamily: 'inherit', background: 'transparent', color: '#231f20',
            }}
          />
          {query && (
            <button onClick={handleClear} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '0 0.75rem', color: '#9b9b9b', display: 'flex', alignItems: 'center',
            }}>
              <X size={16} />
            </button>
          )}
          <button onClick={() => doFetch(query, category, 1)} style={{
            padding: '0 1.5rem', background: '#231f20', color: 'white',
            border: 'none', fontWeight: 700, fontSize: '0.875rem',
            cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
          }}>
            Search
          </button>
        </div>

        {/* Quick search chips */}
        <div style={{
          position: 'relative', zIndex: 1,
          display: 'flex', gap: '0.4rem', flexWrap: 'wrap',
          justifyContent: 'center', marginTop: '1.25rem',
        }}>
          {QUICK_SEARCHES.map(tag => (
            <button
              key={tag}
              onClick={() => handleQuickSearch(tag)}
              style={{
                padding: '0.3rem 0.85rem',
                background: query === tag ? 'white' : 'rgba(255,255,255,0.1)',
                color: query === tag ? '#231f20' : 'rgba(255,255,255,0.75)',
                border: query === tag ? 'none' : '1px solid rgba(255,255,255,0.15)',
                borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div style={{
        background: 'white', borderBottom: '1px solid #e8e8e8',
        padding: '0.75rem 1.5rem',
        display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
      }}>
        {/* LEFT: result count + preview input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6b6b6b', whiteSpace: 'nowrap' }}>
            {loading
              ? 'Loading…'
              : total > 0
                ? `${total.toLocaleString()} fonts${query ? ` for "${query}"` : ''}`
                : ''}
          </span>

          {/* Preview input — left side, always visible */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: '#f5f5f5', border: '1.5px solid #e0e0e0', borderRadius: 8,
            padding: '0.45rem 0.85rem', flex: 1, maxWidth: 340,
          }}>
            <Type size={14} color="#2d43e8" style={{ flexShrink: 0 }} />
            <input
              type="text"
              value={preview}
              onChange={e => setPreview(e.target.value)}
              placeholder="Type to preview any text in all fonts…"
              maxLength={60}
              style={{
                border: 'none', background: 'transparent', outline: 'none',
                fontSize: '0.85rem', color: '#231f20', fontFamily: 'inherit',
                width: '100%',
              }}
              aria-label="Font preview text"
            />
            {preview !== DEFAULT_PREVIEW && preview.trim() !== '' && (
              <button
                onClick={() => setPreview(DEFAULT_PREVIEW)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9b9b9b', display: 'flex', padding: 0, flexShrink: 0 }}
              >
                <X size={13} />
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
          <span style={{ fontSize: '0.75rem', color: '#9b9b9b', fontWeight: 600, flexShrink: 0 }}>Category:</span>
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => handleCategory(c.value)}
              style={{
                padding: '0.3rem 0.75rem',
                background: category === c.value ? '#231f20' : '#f5f5f5',
                color: category === c.value ? 'white' : '#6b6b6b',
                border: 'none', borderRadius: 6,
                fontSize: '0.75rem', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
                flexShrink: 0, whiteSpace: 'nowrap'
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>


      {/* ── Font Grid ── */}
      <div className="fonts-grid-container" style={{ padding: '1.5rem 1.5rem 3rem' }}>
        <div className="fonts-grid" style={{
          display: 'grid',
          gap: '1rem',
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

      <style>{`
        .fonts-grid {
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        }
        .font-card-item:hover {
          box-shadow: 0 4px 16px rgba(0,0,0,0.08) !important;
          border-color: #d1d5db !important;
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        @media (max-width: 640px) {
          .fonts-grid-container {
            padding: 1rem 1rem 3rem !important;
          }
          .fonts-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
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
