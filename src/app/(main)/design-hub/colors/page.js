'use client';
import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { Copy, Check, RefreshCw, Sparkles, Lock, Unlock, ChevronDown, Heart, Code, X, Layers } from 'lucide-react';

// ─── Pure colour math (no deps) ───────────────────────────────────────────────

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}
function rgbToHex([r,g,b]) {
  return [r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase();
}
function getLum([r,g,b]) { return 0.299*r+0.587*g+0.114*b; }

function hslToHex(h,s,l) {
  s/=100; l/=100;
  const a=s*Math.min(l,1-l);
  const f=n=>{ const k=(n+h/30)%12; const c=l-a*Math.max(Math.min(k-3,9-k,1),-1); return Math.round(255*c).toString(16).padStart(2,'0'); };
  return (f(0)+f(8)+f(4)).toUpperCase();
}
function hexToHsl(hex) {
  let [r,g,b]=hexToRgb(hex); r/=255;g/=255;b/=255;
  const max=Math.max(r,g,b),min=Math.min(r,g,b);
  let h=0,s=0,l=(max+min)/2;
  if(max!==min){ const d=max-min; s=l>.5?d/(2-max-min):d/(max+min);
    if(max===r) h=((g-b)/d+(g<b?6:0))/6;
    else if(max===g) h=((b-r)/d+2)/6;
    else h=((r-g)/d+4)/6; }
  return [Math.round(h*360),Math.round(s*100),Math.round(l*100)];
}

function hsvToHsl(h, s_hsv, v_hsv) {
  const s = s_hsv / 100;
  const v = v_hsv / 100;
  const l = v * (1 - s / 2);
  const s_hsl = (l === 0 || l === 1) ? 0 : (v - l) / Math.min(l, 1 - l);
  return [h, Math.round(s_hsl * 100), Math.round(l * 100)];
}

function hslToHsv(h, s_hsl, l_hsl) {
  const s = s_hsl / 100;
  const l = l_hsl / 100;
  const v = l + s * Math.min(l, 1 - l);
  const s_hsv = v === 0 ? 0 : 2 * (1 - l / v);
  return [h, Math.round(s_hsv * 100), Math.round(v * 100)];
}

function formatModel(name) {
  return name.split('_').map(w=>w[0].toUpperCase()+w.slice(1)).join(' ');
}

const HUES = [
  'All', 'Red', 'Orange', 'Yellow', 'Lime', 'Green', 
  'Teal', 'Cyan', 'Azure', 'Blue', 'Violet', 'Magenta', 'Pink'
];

// ─── Export formats ───────────────────────────────────────────────────────────

function buildExports(colors) {
  const hex = colors.map(c=>`#${c}`);
  const cssVars = hex.map((h,i)=>`  --color-${i+1}: ${h};`).join('\n');
  const tw = hex.map((h,i)=>`      'brand-${i+1}': '${h}',`).join('\n');
  const scss = hex.map((h,i)=>`$color-${i+1}: ${h};`).join('\n');
  return {
    hex: hex.join(', '),
    css: `:root {\n${cssVars}\n}`,
    tailwind: `// tailwind.config.js\ncolors: {\n${tw}\n}`,
    scss,
  };
}

// ─── Inline Color Picker (no deps) ───────────────────────────────────────────

const QUICK_PRESETS = [
  '#EF4444','#F97316','#EAB308','#22C55E','#14B8A6',
  '#3B82F6','#6366F1','#A855F7','#EC4899','#231F20',
  '#6B7280','#FFFFFF',
];

function InlinePicker({ hex, onChange, onClose }) {
  const [hsl, setHsl] = useState(() => hexToHsl(hex));
  const [hexInput, setHexInput] = useState(hex.replace('#','').toUpperCase());
  const hueRef = useRef(null);
  const slRef = useRef(null);
  const dragging = useRef(null);

  const applyHsl = useCallback((h,s,l) => {
    const newHex = hslToHex(h,s,l);
    setHsl([h,s,l]);
    setHexInput(newHex);
    onChange('#'+newHex);
  },[onChange]);

  // Hue drag
  const onHueDrag = useCallback((e) => {
    if (!hueRef.current) return;
    const rect = hueRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    applyHsl(Math.round(x*360), hsl[1], hsl[2]);
  },[hsl, applyHsl]);

  // SL drag
  const onSlDrag = useCallback((e) => {
    if (!slRef.current) return;
    const rect = slRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    
    // The visual map represents HSV: x = Saturation, y = (1 - Value)
    const s_hsv = x * 100;
    const v_hsv = (1 - y) * 100;
    const [, s_hsl, l_hsl] = hsvToHsl(hsl[0], s_hsv, v_hsv);
    applyHsl(hsl[0], s_hsl, l_hsl);
  },[hsl, applyHsl]);

  useEffect(() => {
    const up = () => { dragging.current = null; };
    const move = (e) => {
      if (dragging.current === 'hue') onHueDrag(e);
      if (dragging.current === 'sl') onSlDrag(e);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, [onHueDrag, onSlDrag]);

  const handleHexInput = (v) => {
    const clean = v.replace(/[^0-9a-fA-F]/g,'').slice(0,6);
    setHexInput(clean.toUpperCase());
    if (clean.length === 6) {
      const newHsl = hexToHsl('#'+clean);
      setHsl(newHsl);
      onChange('#'+clean.toUpperCase());
    }
  };

  const [h,s,l] = hsl;
  const [, s_hsv, v_hsv] = hslToHsv(h, s, l);
  const pureHue = hslToHex(h,100,50);
  const cursorX = s_hsv;
  const cursorY = 100 - v_hsv;

  return (
    <div style={{ background:'white', borderRadius:16, padding:'1rem', boxShadow:'0 16px 48px rgba(0,0,0,0.18)', width:260, border:'1px solid #e8e8e8', userSelect:'none' }} onClick={e=>e.stopPropagation()}>
      {/* SL map */}
      <div
        ref={slRef}
        onMouseDown={e=>{ dragging.current='sl'; onSlDrag(e); }}
        style={{
          width:'100%', height:140, borderRadius:10, marginBottom:'0.7rem',
          background:`linear-gradient(to right, white, #${pureHue})`,
          position:'relative', cursor:'crosshair', overflow:'hidden',
        }}
      >
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, transparent, black)' }} />
        {/* Cursor */}
        <div style={{
          position:'absolute', width:14, height:14, borderRadius:'50%',
          border:'2px solid white', boxShadow:'0 0 0 1px rgba(0,0,0,0.3)',
          background:`#${hexInput}`,
          left:`${cursorX}%`, top:`${cursorY}%`,
          transform:'translate(-50%,-50%)', pointerEvents:'none',
        }} />
      </div>

      {/* Hue bar */}
      <div
        ref={hueRef}
        onMouseDown={e=>{ dragging.current='hue'; onHueDrag(e); }}
        style={{
          width:'100%', height:14, borderRadius:8, marginBottom:'0.8rem',
          background:'linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)',
          position:'relative', cursor:'ew-resize',
        }}
      >
        <div style={{
          position:'absolute', top:'50%', transform:'translate(-50%,-50%)',
          left:`${h/360*100}%`,
          width:16, height:16, borderRadius:'50%',
          border:'2px solid white', boxShadow:'0 0 0 1px rgba(0,0,0,0.2)',
          background:`hsl(${h},100%,50%)`, pointerEvents:'none',
        }} />
      </div>

      {/* Hex input */}
      <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.75rem' }}>
        <div style={{ width:28, height:28, borderRadius:6, background:`#${hexInput}`, border:'1px solid #e0e0e0', flexShrink:0 }} />
        <div style={{ display:'flex', alignItems:'center', flex:1, border:'1px solid #e0e0e0', borderRadius:8, overflow:'hidden' }}>
          <span style={{ padding:'0.35rem 0.5rem', background:'#f8f8f8', color:'#9b9b9b', fontSize:'0.8rem', fontWeight:700, borderRight:'1px solid #e0e0e0' }}>#</span>
          <input
            value={hexInput}
            onChange={e=>handleHexInput(e.target.value)}
            style={{ flex:1, border:'none', outline:'none', padding:'0.35rem 0.5rem', fontWeight:700, fontSize:'0.82rem', fontFamily:'monospace', color:'#231f20' }}
            maxLength={6}
          />
        </div>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#9b9b9b', display:'flex', padding:4 }}>
          <X size={14} />
        </button>
      </div>

      {/* HSL readout */}
      <div style={{ display:'flex', gap:'0.3rem', marginBottom:'0.75rem' }}>
        {[['H',h,'°'],['S',s,'%'],['L',l,'%']].map(([lbl,val,unit])=>(
          <div key={lbl} style={{ flex:1, background:'#f8f8f8', borderRadius:8, padding:'0.35rem 0.5rem', textAlign:'center' }}>
            <div style={{ fontSize:'0.6rem', color:'#9b9b9b', fontWeight:700, marginBottom:1 }}>{lbl}</div>
            <div style={{ fontSize:'0.8rem', fontWeight:800, color:'#231f20' }}>{val}{unit}</div>
          </div>
        ))}
      </div>

      {/* Quick presets */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:'0.3rem' }}>
        {QUICK_PRESETS.map(p=>(
          <button
            key={p}
            onClick={()=>{ const nh=hexToHsl(p); setHsl(nh); setHexInput(p.replace('#','')); onChange(p); }}
            style={{
              width:22, height:22, borderRadius:6, background:p,
              border: p.replace('#','').toUpperCase() === hexInput ? '2px solid #231f20' : '1px solid rgba(0,0,0,0.1)',
              cursor:'pointer',
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Color Slot ───────────────────────────────────────────────────────────────

function ColorSlot({ index, hex, isPinned, isActive, onTogglePin, onColorChange, onActivate, allowAI, isFirst, isLast }) {
  const lum = getLum(hexToRgb(hex));
  const textColor = lum > 140 ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.6)';
  const activeTextColor = lum > 140 ? 'rgba(0,0,0,1)' : 'rgba(255,255,255,1)';

  return (
    <div
      className="hero-color-slot"
      onClick={() => onActivate(index)}
      style={{
        position: 'relative',
        flex: isActive ? 1.6 : 1,
        height: '100%',
        background: hex,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'flex 0.4s cubic-bezier(0.16, 1, 0.3, 1), background 0.3s ease',
      }}
    >
      <div 
        className="slot-content"
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '1.25rem', 
          transition: 'all 0.3s ease',
        }}
      >
        {allowAI && (
          <button
            onClick={e=>{ e.stopPropagation(); onTogglePin(index); }}
            className="slot-pin-btn"
            style={{ 
              background: 'transparent', 
              border: 'none', 
              cursor: 'pointer',
              opacity: isPinned ? 1 : (isActive ? 0.8 : 0),
              transition: 'all 0.2s ease',
              padding: '0.5rem',
              transform: isPinned || isActive ? 'scale(1)' : 'scale(0.8)'
            }}
            title={isPinned ? 'Unpin' : 'Pin'}
          >
            {isPinned ? <Lock size={26} color={activeTextColor} /> : <Unlock size={26} color={textColor} />}
          </button>
        )}

        <span 
          className="slot-hex-text"
          style={{ 
            fontSize: isActive ? '1.75rem' : '1.15rem', 
            fontWeight: 900, 
            color: isPinned || isActive ? activeTextColor : textColor, 
            letterSpacing: '0.08em', 
            fontFamily: 'var(--font-mono, monospace)',
            textTransform: 'uppercase',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {(!allowAI) ? hex.replace('#', '') : (isPinned || isActive ? hex.replace('#', '') : 'AI')}
        </span>
      </div>
    </div>
  );
}

// ─── Palette Card ─────────────────────────────────────────────────────────────

function PaletteCard({ palette, onCopy, copied, onSave, saved }) {
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFmt, setExportFmt] = useState('hex');
  const [fmtCopied, setFmtCopied] = useState(false);
  const exports = buildExports(palette.colors);

  const copyFmt = async () => {
    await navigator.clipboard.writeText(exports[exportFmt]);
    setFmtCopied(true);
    setTimeout(()=>setFmtCopied(false),2000);
  };

  return (
    <div style={{ background:'white', borderRadius:12, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.04)', border:'1px solid #e5e7eb', display:'flex', flexDirection:'column', transition:'transform 0.2s, box-shadow 0.2s' }} className="palette-card">
      {/* Color Strip */}
      <div style={{ display:'flex', height:140 }}>
        {palette.colors.map((hex,i) => {
          const lum = getLum(hexToRgb(hex));
          return (
            <div
              key={i}
              className="color-swatch"
              onClick={()=>{ navigator.clipboard.writeText(`#${hex}`); }}
              style={{ flex:1, background:`#${hex}`, display:'flex', flexDirection:'column', justifyContent:'flex-end', alignItems:'center', paddingBottom:'0.75rem', transition:'flex 0.3s ease', cursor:'pointer' }}
              title={`Copy #${hex}`}
            >
              <span className="hex-label" style={{ opacity:0, fontSize:'0.7rem', fontWeight:700, color:lum>140?'rgba(0,0,0,0.8)':'rgba(255,255,255,0.95)', letterSpacing:'0.04em', transition:'opacity 0.2s', pointerEvents:'none', fontFamily:'monospace' }}>
                {hex.toUpperCase()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ padding:'1rem' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontWeight:700, fontSize:'0.9rem', color:'#111827' }}>{palette.title}</div>
          <div style={{ display:'flex', gap:'0.25rem' }}>
            <button onClick={()=>onSave(palette)} style={{ background:'none', border:'none', cursor:'pointer', color:saved?'#ef4444':'#9ca3af', display:'flex', padding:'0.35rem', borderRadius:6, transition:'color 0.2s' }} className="icon-btn" title={saved?'Remove from saved':'Save palette'}>
              <Heart size={16} fill={saved?'currentColor':'none'} />
            </button>
            <button onClick={()=>setExportOpen(o=>!o)} style={{ background:'none', border:'none', cursor:'pointer', color:exportOpen?'#111827':'#9ca3af', display:'flex', padding:'0.35rem', borderRadius:6, transition:'color 0.2s' }} className="icon-btn" title="Export">
              <Code size={16} />
            </button>
            <button
              onClick={()=>onCopy(palette)}
              style={{ background:'none', border:'none', cursor:'pointer', color:copied?'#10b981':'#9ca3af', display:'flex', padding:'0.35rem', borderRadius:6, transition:'color 0.2s' }}
              className="icon-btn"
              title="Copy all hex"
            >
              {copied?<Check size={16}/>:<Copy size={16}/>}
            </button>
          </div>
        </div>

        {/* Export panel */}
        {exportOpen && (
          <div style={{ marginTop:'0.75rem', borderTop:'1px solid #f3f4f6', paddingTop:'0.75rem' }}>
            <div style={{ display:'flex', gap:'0.4rem', marginBottom:'0.6rem' }}>
              {['hex','css','tailwind','scss'].map(f=>(
                <button
                  key={f}
                  onClick={()=>setExportFmt(f)}
                  style={{ flex:1, padding:'0.3rem', border:'none', borderRadius:6, background:exportFmt===f?'#111827':'#f3f4f6', color:exportFmt===f?'white':'#4b5563', fontSize:'0.65rem', fontWeight:700, cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.04em', transition:'all 0.2s' }}
                >
                  {f}
                </button>
              ))}
            </div>
            <div style={{ background:'#f9fafb', borderRadius:8, padding:'0.6rem 0.75rem', position:'relative', border:'1px solid #e5e7eb' }}>
              <pre style={{ margin:0, fontSize:'0.7rem', fontFamily:'monospace', color:'#374151', whiteSpace:'pre-wrap', wordBreak:'break-all', maxHeight:80, overflow:'auto' }}>
                {exports[exportFmt]}
              </pre>
              <button
                onClick={copyFmt}
                style={{ position:'absolute', top:'0.5rem', right:'0.5rem', background:fmtCopied?'#10b981':'white', color:fmtCopied?'white':'#374151', border:'1px solid #e5e7eb', borderRadius:6, padding:'0.25rem 0.5rem', cursor:'pointer', fontSize:'0.65rem', fontWeight:700, display:'flex', alignItems:'center', gap:3, transition:'all 0.2s' }}
              >
                {fmtCopied?<Check size={11}/>:<Copy size={11}/>} {fmtCopied?'Copied':'Copy'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── AI Generator Panel ───────────────────────────────────────────────────────

function AIGeneratorPanel({ models, onGenerate, generating, result, onSave, savedIds, count, onCopy, copiedId }) {
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
    setIsClient(true);
    try {
      const items = JSON.parse(localStorage.getItem('desayner_palettes') || '[]');
      setSaved(items);
      setSavedIds(new Set(items.map((p) => p.id)));
    } catch {
      setSaved([]);
      setSavedIds(new Set());
    }
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

      <style>{`
        .palette-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.1) !important; }
        .color-swatch:hover { flex: 1.6 !important; }
        .color-swatch:hover .hex-label { opacity: 1 !important; }
        
        /* Hero Slot Hover Enhancements */
        .hero-color-slot:hover .slot-pin-btn { opacity: 1 !important; transform: scale(1) !important; }
        .hero-color-slot:hover .slot-hex-text { opacity: 1 !important; font-size: 1.75rem !important; }
        .hero-color-slot:hover { z-index: 10; box-shadow: 0 0 40px rgba(0,0,0,0.15); }
        
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
