'use client';
import { useState, useEffect, useCallback } from 'react';
import { Copy, Check, RefreshCw, Layers } from 'lucide-react';

export default function ColorsPage() {
  const [explorePalettes, setExplorePalettes] = useState([]);
  const [exploreLoading, setExploreLoading] = useState(false);
  const [explorePage, setExplorePage] = useState(1);
  const [copiedPaletteId, setCopiedPaletteId] = useState(null);
  
  // New option to pick how many colors
  const [colorCount, setColorCount] = useState(5);
  // New option to filter by base color
  const [activeHue, setActiveHue] = useState('All');

  const HUES = ['All', 'Red', 'Orange', 'Yellow', 'Lime', 'Green', 'Teal', 'Cyan', 'Azure', 'Blue', 'Violet', 'Magenta', 'Pink'];

  const fetchExplorePalettes = useCallback(async (pageNum, count, hue) => {
    setExploreLoading(true);
    try {
      const res = await fetch(`/api/explore-colors?page=${pageNum}&colors=${count}&hue=${hue}`);
      const data = await res.json();
      if (data.palettes) {
        if (pageNum === 1) setExplorePalettes(data.palettes);
        else setExplorePalettes(prev => [...prev, ...data.palettes]);
        setExplorePage(pageNum);
      }
    } catch (err) {
      console.error('Failed to fetch explore palettes', err);
    } finally {
      setExploreLoading(false);
    }
  }, []);

  // Fetch when page mounts or filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchExplorePalettes(1, colorCount, activeHue);
    }, 0);

    return () => clearTimeout(timer);
  }, [colorCount, activeHue, fetchExplorePalettes]);

  const copyPaletteHex = async (hexArray, id) => {
    try {
      await navigator.clipboard.writeText(hexArray.map(h => `#${h}`).join(', '));
      setCopiedPaletteId(id);
      setTimeout(() => setCopiedPaletteId(null), 2000);
    } catch (err) {
      console.error('Failed to copy palette', err);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column', background: '#f8f9fa' }}>
      
      {/* Top Header */}
      <div style={{ 
        padding: '1.5rem 2rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: 'white',
        borderBottom: '1px solid #e8e8e8',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#0a0a0a' }}>Explore Palettes</h1>
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
            <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
            <div className="hide-scrollbar" style={{ display: 'flex', gap: '0.5rem' }}>
              {HUES.map(hue => (
                <button
                  key={hue}
                  onClick={() => setActiveHue(hue)}
                  style={{
                    padding: '0.45rem 1rem',
                    borderRadius: 20,
                    border: activeHue === hue ? 'none' : '1px solid #e5e5e5',
                    background: activeHue === hue ? '#0a0a0a' : 'white',
                    color: activeHue === hue ? 'white' : '#6b6b6b',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s'
                  }}
                >
                  {hue}
                </button>
              ))}
            </div>
          </div>

          <div style={{ width: '1px', height: '24px', background: '#e5e5e5', margin: '0 0.5rem' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={18} color="#6b6b6b" />
            <select
              value={colorCount}
              onChange={(e) => setColorCount(Number(e.target.value))}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                background: 'white',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                outline: 'none',
                color: '#0a0a0a'
              }}
            >
              {[3, 4, 5, 6, 7, 8].map(num => (
                <option key={num} value={num}>{num} Colors</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '1rem',
          maxWidth: 1600, 
          margin: '0 auto'
        }}>
          {explorePalettes.map(palette => (
            <div 
              key={palette.id}
              className="palette-card"
              style={{ 
                background: 'white', 
                borderRadius: 16, 
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
                border: '1px solid #f0f0f0',
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer'
              }}
              onClick={() => copyPaletteHex(palette.colors, palette.id)}
            >
              {/* Palette Strip */}
              <div style={{ display: 'flex', height: '160px' }}>
                {palette.colors.map((hex, i) => (
                  <div 
                    key={i} 
                    className="color-block"
                    style={{ 
                      flex: 1, 
                      background: `#${hex}`,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      paddingBottom: '0.75rem',
                      transition: 'flex 0.3s ease'
                    }}
                  >
                    <span className="hex-tooltip" style={{
                      opacity: 0,
                      background: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      fontSize: '0.7rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: 4,
                      fontWeight: 700,
                      transition: 'opacity 0.2s',
                      pointerEvents: 'none'
                    }}>
                      #{hex}
                    </span>
                  </div>
                ))}
              </div>

              {/* Details & Actions */}
              <div style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ overflow: 'hidden' }}>
                  <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 800, color: '#0a0a0a', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {palette.title}
                  </h3>
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    {palette.colors.map((hex, i) => (
                      <div key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: `#${hex}` }} />
                    ))}
                  </div>
                </div>

                <button
                  style={{
                    background: copiedPaletteId === palette.id ? '#16a34a' : '#f5f5f5',
                    color: copiedPaletteId === palette.id ? 'white' : '#0a0a0a',
                    border: 'none', borderRadius: 10, padding: '0.6rem',
                    cursor: 'pointer', transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                  title="Copy all hex codes"
                >
                  {copiedPaletteId === palette.id ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Load More & Loading States */}
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          {exploreLoading && explorePalettes.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: '#0009fa' }}>
              <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontWeight: 700 }}>Generating infinite palettes...</span>
            </div>
          ) : (
            <button
              onClick={() => fetchExplorePalettes(explorePage + 1, colorCount, activeHue)}
              disabled={exploreLoading}
              style={{
                padding: '0.85rem 2.5rem', background: '#0009fa', color: 'white',
                border: 'none', borderRadius: 12,
                fontWeight: 800, cursor: exploreLoading ? 'not-allowed' : 'pointer',
                boxShadow: '0 8px 20px rgba(0,9,250,0.2)', 
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                fontSize: '1rem', transition: 'all 0.2s'
              }}
            >
              {exploreLoading ? <><RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> Loading...</> : 'Load More'}
            </button>
          )}
        </div>
      </div>

      <style>{`
        .palette-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.08) !important; }
        .color-block:hover { flex: 1.5 !important; }
        .color-block:hover .hex-tooltip { opacity: 1 !important; }
      `}</style>
    </div>
  );
}
