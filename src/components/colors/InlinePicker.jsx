'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { hexToHsl, hslToHex, hsvToHsl, hslToHsv } from '@/lib/colorUtils';

const QUICK_PRESETS = [
  '#EF4444','#F97316','#EAB308','#22C55E','#14B8A6',
  '#3B82F6','#6366F1','#A855F7','#EC4899','#231F20',
  '#6B7280','#FFFFFF',
];

export default function InlinePicker({ hex, onChange, onClose }) {
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
