'use client';

import { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { Sparkles, ChevronDown, Layers, RefreshCw, Heart } from 'lucide-react';
import ColorSlot from './ColorSlot';
import InlinePicker from './InlinePicker';
import PaletteCard from './PaletteCard';
import { hexToRgb, formatModel } from '@/lib/colorUtils';

export default function AIGeneratorPanel({ models, onGenerate, generating, result, onSave, savedIds, count, onCopy, copiedId }) {
  const [slotHexes, setSlotHexes] = useState(['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#22c55e']);
  const [pinned, setPinned] = useState([false,false,false,false,false,false,false,false]);
  const [model, setModel] = useState('default');
  const [modelOpen, setModelOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState(null);
  const [pickerWidth, setPickerWidth] = useState(1000);
  const pickerRef = useRef(null);

  const allowAI = count <= 5;

  useLayoutEffect(() => {
    const el = pickerRef.current;
    if (!el) return;

    const updateWidth = () => setPickerWidth(el.offsetWidth || 1000);
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, [count]);

  useEffect(() => {
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setActiveSlot(null);
    };
    document.addEventListener('mousedown', handler);
    return ()=>document.removeEventListener('mousedown', handler);
  }, []);

  const togglePin = (i) => {
    if(!allowAI) return;
    setPinned(p => { const n=[...p]; n[i]=!n[i]; return n; });
  }

  const handleActivate = (i) => setActiveSlot(activeSlot===i ? null : i);

  const handleColorChange = (i, hex) => {
    setSlotHexes(prev => { const n=[...prev]; n[i]=hex; return n; });
    if (allowAI && !pinned[i]) setPinned(p => { const n=[...p]; n[i]=true; return n; });
  };

  const buildInput = () => {
    return Array.from({ length: 5 }, (_,i) => {
      if (i >= count) return 'N';
      return pinned[i] ? hexToRgb(slotHexes[i]) : 'N';
    });
  };

  const handleGenerate = () => {
    onGenerate({ model, input: buildInput(), count });
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ background:'white', position: 'relative', width: '100%' }}>
        
        {/* Color Strip (Zero Padding, Full Bleed) */}
        <div ref={pickerRef} style={{ position:'relative', height: 400, display: 'flex', width: '100%' }}>
          {slotHexes.slice(0, count).map((hex, i) => (
            <ColorSlot
              key={i}
              index={i}
              hex={hex}
              isPinned={pinned[i]}
              isActive={activeSlot===i}
              onTogglePin={togglePin}
              onColorChange={handleColorChange}
              onActivate={handleActivate}
              allowAI={allowAI}
              isFirst={false}
              isLast={false}
            />
          ))}

          {/* Inline picker popover */}
          {activeSlot !== null && activeSlot < count && (
            <div style={{
              position:'absolute', top:'100%', zIndex:400, marginTop: '1rem',
              left: `${Math.min(activeSlot * (100/count), 100 - (260 / pickerWidth * 100))}%`,
              transform: 'translateX(-20px)'
            }}>
              <InlinePicker
                hex={slotHexes[activeSlot]}
                onChange={(hex) => handleColorChange(activeSlot, hex)}
                onClose={() => setActiveSlot(null)}
              />
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', background: 'white', borderBottom: '1px solid #e8e8e8', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', width: 40, height: 40, borderRadius: 10, background: '#f3f4f6' }}>
               <Sparkles size={20} color="#111827" />
            </div>
            <div>
              <div style={{ fontWeight: 800, color: '#111827', fontSize: '0.95rem' }}>Palette Generator</div>
              <div style={{ color: '#6b7280', fontSize: '0.75rem', fontWeight: 500 }}>Click to pick • Lock to keep • {allowAI ? 'AI fills the rest' : 'Manual mode'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {allowAI ? (
              <>
                <div style={{ position:'relative' }}>
                  <button onClick={()=>setModelOpen(o=>!o)} style={{ display:'flex', alignItems:'center', gap:'0.4rem', background:'white', border:'1px solid #e5e7eb', borderRadius:8, padding:'0.55rem 0.85rem', color:'#374151', fontSize:'0.8rem', fontWeight:600, cursor:'pointer', transition: 'background 0.2s' }} className="icon-btn">
                    <Layers size={14} color="#6b7280" />
                    {formatModel(model)}
                    <ChevronDown size={14} style={{ color:'#6b7280', transform:modelOpen?'rotate(180deg)':'none', transition:'transform 0.2s' }} />
                  </button>
                  {modelOpen && (
                    <div style={{ position:'absolute', bottom:'calc(100% + 8px)', right:0, background:'white', borderRadius:10, boxShadow:'0 10px 30px rgba(0,0,0,0.1)', zIndex:300, padding:'0.4rem', minWidth:180, border:'1px solid #e5e7eb' }}>
                      {models.map(m=>(
                        <button key={m} onClick={()=>{ setModel(m); setModelOpen(false); }} style={{ display:'block', width:'100%', textAlign:'left', padding:'0.5rem 0.75rem', border:'none', borderRadius:6, background:m===model?'#f3f4f6':'transparent', fontWeight:m===model?600:500, fontSize:'0.8rem', color:'#111827', cursor:'pointer' }}>
                          {formatModel(m)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={handleGenerate} disabled={generating} style={{ padding:'0.55rem 1.25rem', background:'#111827', border:'none', borderRadius:8, color:'white', fontWeight:700, fontSize:'0.85rem', cursor:generating?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:'0.5rem', transition: 'background 0.2s' }}>
                  {generating ? <RefreshCw size={14} style={{ animation:'spin 0.8s linear infinite' }} /> : <Sparkles size={14} />} 
                  Generate
                </button>
              </>
            ) : (
              <button onClick={() => onSave({ id: Math.random().toString(36).slice(2), title: 'Custom Palette', colors: slotHexes.slice(0, count).map(h => h.replace('#','')) })} style={{ padding:'0.55rem 1.25rem', background:'#111827', border:'none', borderRadius:8, color:'white', fontWeight:700, fontSize:'0.85rem', cursor:'pointer', display:'flex', alignItems:'center', gap:'0.5rem' }}>
                <Heart size={14} /> Save Palette
              </button>
            )}
          </div>
        </div>
      </div>

      {result && allowAI && (
        <div style={{ padding: '2.5rem 1.5rem 0', maxWidth: 1600, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Sparkles size={14} color="#10b981" />
            <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#10b981' }}>Generated Palette</span>
          </div>
          <div style={{ maxWidth: 400 }}>
            <PaletteCard palette={result} onCopy={onCopy} copied={copiedId === result.id} onSave={onSave} saved={savedIds.has(result.id)} />
          </div>
        </div>
      )}
    </div>
  );
}
