'use client';
import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { RefreshCw, Heart, Layers } from 'lucide-react';
import AIGeneratorPanel from '@/components/colors/AIGeneratorPanel';
import PaletteCard from '@/components/colors/PaletteCard';
import './colors.css';



const HUES = [
  'All', 'Red', 'Orange', 'Yellow', 'Lime', 'Green', 
  'Teal', 'Cyan', 'Azure', 'Blue', 'Violet', 'Magenta', 'Pink'
];



// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ColorsPage() {
  const [palettes, setPalettes] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [models, setModels] = useState(['default','ui']);
  const [aiResult, setAiResult] = useState(null);
  
  // State from sticky header
  const [activeHue, setActiveHue] = useState('All');
  const [colorCount, setColorCount] = useState(5);
  
  // Local storage favorites
  const [saved, setSaved] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    const init = async () => {
      setIsClient(true);
      try {
        const items = JSON.parse(localStorage.getItem('desayner_palettes') || '[]');
        setSaved(items);
        setSavedIds(new Set(items.map((p) => p.id)));
      } catch {
        setSaved([]);
        setSavedIds(new Set());
      }
    };
    init();
  }, []);
  const [loadedFilterKey, setLoadedFilterKey] = useState(null);

  const filterKey = `${colorCount}:${activeHue}`;
  const isLoadingPalettes = loadedFilterKey !== filterKey;

  const persistSaved = (list) => {
    setSaved(list);
    setSavedIds(new Set(list.map(p=>p.id)));
    try { localStorage.setItem('desayner_palettes', JSON.stringify(list)); } catch {}
  };

  const handleSave = (palette) => {
    if (savedIds.has(palette.id)) {
      persistSaved(saved.filter(p=>p.id!==palette.id));
    } else {
      persistSaved([palette, ...saved]);
    }
  };

  useEffect(() => {
    fetch('/api/colormind-models').then(r=>r.json()).then(d=>{ if(d.models) setModels(d.models); }).catch(()=>{});
  }, []);

  const loadPalettes = useCallback(async (append=false) => {
    if (append) {
      setLoadingMore(true);
      try {
        const res = await fetch(`/api/explore-colors?colors=${colorCount}&hue=${activeHue}`);
        const data = await res.json();
        if (data.palettes) setPalettes((p) => [...p, ...data.palettes]);
      } catch (e) { console.error(e); }
      finally { setLoadingMore(false); }
      return;
    }
  }, [colorCount, activeHue]);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/explore-colors?colors=${colorCount}&hue=${activeHue}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.palettes) {
          setPalettes(data.palettes);
          setLoadedFilterKey(filterKey);
        }
      })
      .catch(console.error);

    return () => { cancelled = true; };
  }, [filterKey, colorCount, activeHue]);

  const handleCopy = async (palette) => {
    await navigator.clipboard.writeText(palette.colors.map(h=>`#${h}`).join(', '));
    setCopiedId(palette.id);
    setTimeout(()=>setCopiedId(null),2000);
  };

  const handleAIGenerate = async ({ model, input, count }) => {
    setGenerating(true);
    setAiResult(null);
    try {
      const res = await fetch('/api/explore-colors', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ model, input, count }),
      });
      const data = await res.json();
      if (data.palette) setAiResult(data.palette);
    } catch(e){ console.error(e); }
    finally { setGenerating(false); }
  };

  return (
    <div style={{ minHeight:'calc(100vh - 56px)', background:'#f8f9fa' }}>

      {/* STICKY HEADER (Matches User Request) */}
      <div style={{ 
        padding: '1.5rem 1.5rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: 'white',
        borderBottom: '1px solid #e8e8e8',
        position: 'sticky',
        top: 56, // Account for main app header if it exists
        zIndex: 100,
        boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#231f20' }}>Explore Palettes</h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#6b6b6b', fontSize: '0.9rem' }}>
            Discover and copy infinite harmonious color combinations
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {/* Hue Filter Pills */}
          <div style={{
            display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem',
            scrollbarWidth: 'none', msOverflowStyle: 'none'
          }}>
            {HUES.map(hue => (
              <button
                key={hue}
                onClick={() => setActiveHue(hue)}
                style={{
                  padding: '0.4rem 1rem',
                  borderRadius: '20px',
                  border: activeHue === hue ? '1px solid #231f20' : '1px solid #e8e8e8',
                  background: activeHue === hue ? '#231f20' : 'white',
                  color: activeHue === hue ? 'white' : '#6b6b6b',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease'
                }}
              >
                {hue}
              </button>
            ))}
          </div>

          <div style={{ width: '1px', height: '24px', background: '#e8e8e8', margin: '0 0.5rem' }} />

          {/* Color Count Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={18} color="#6b6b6b" />
            <select
              value={colorCount}
              onChange={(e) => setColorCount(Number(e.target.value))}
              style={{
                padding: '0.4rem 2rem 0.4rem 1rem',
                borderRadius: '8px',
                border: '1px solid #e8e8e8',
                background: 'white',
                color: '#231f20',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                appearance: 'none',
                backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.5rem center',
                backgroundSize: '1em'
              }}
            >
              {[3, 4, 5, 6, 7, 8].map(num => (
                <option key={num} value={num}>{num} Colors</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* AI Panel (Full Bleed - Zero Padding) */}
      <AIGeneratorPanel
        models={models}
        onGenerate={handleAIGenerate}
        generating={generating}
        result={aiResult}
        onSave={handleSave}
        savedIds={savedIds}
        count={colorCount}
        onCopy={handleCopy}
        copiedId={copiedId}
      />

      <div style={{ padding:'2.5rem 1.5rem', maxWidth:1600, margin:'0 auto' }}>

        {/* Saved Palettes */}
        {isClient && saved.length > 0 && (
          <div style={{ marginBottom:'2rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.75rem' }}>
              <Heart size={14} color="#ef4444" fill="#ef4444" />
              <span style={{ fontWeight:700, fontSize:'0.85rem', color:'#231f20' }}>Saved Palettes</span>
              <span style={{ fontSize:'0.75rem', color:'#9b9b9b' }}>({saved.length})</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px,1fr))', gap:'0.75rem' }}>
              {saved.map(p=>(
                <PaletteCard key={p.id} palette={p} onCopy={handleCopy} copied={copiedId===p.id} onSave={handleSave} saved />
              ))}
            </div>
          </div>
        )}

        {/* Explore Grid */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1.5rem' }}>
          <div style={{ flex:1, height:1, background:'#e8e8e8' }} />
          <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#9b9b9b', textTransform:'uppercase', letterSpacing:'0.07em', whiteSpace:'nowrap' }}>
            {activeHue !== 'All' ? `${activeHue} Palettes` : 'All Palettes'}
          </span>
          <div style={{ flex:1, height:1, background:'#e8e8e8' }} />
        </div>

        {isLoadingPalettes ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:'1rem' }}>
            {[...Array(12)].map((_,i) => <div key={i} className="shimmer-box" style={{ height:200, borderRadius:16 }} />)}
          </div>
        ) : (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:'1rem' }}>
              {palettes.map(p => (
                <PaletteCard key={p.id} palette={p} onCopy={handleCopy} copied={copiedId===p.id} onSave={handleSave} saved={savedIds.has(p.id)} />
              ))}
            </div>
            <div style={{ textAlign:'center', paddingTop:'2.5rem' }}>
              <button
                onClick={()=>loadPalettes(true)}
                disabled={loadingMore}
                style={{ padding:'0.85rem 2.5rem', background:loadingMore?'#e0e0e0':'#2d43e8', color:loadingMore?'#9b9b9b':'white', border:'none', borderRadius:12, fontWeight:800, cursor:loadingMore?'not-allowed':'pointer', display:'inline-flex', alignItems:'center', gap:'0.5rem', fontSize:'0.95rem', transition:'all 0.2s', boxShadow:loadingMore?'none':'0 8px 20px rgba(45,67,232,0.2)' }}
              >
                {loadingMore ? <><RefreshCw size={16} style={{ animation:'spin 0.8s linear infinite' }} /> Loading…</> : 'Load More Palettes'}
              </button>
            </div>
          </>
        )}
      </div>


    </div>
  );
}
