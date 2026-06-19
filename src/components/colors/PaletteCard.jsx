'use client';

import { useState } from 'react';
import { Heart, Code, Copy, Check } from 'lucide-react';
import { getLum, hexToRgb, buildExports } from '@/lib/colorUtils';

export default function PaletteCard({ palette, onCopy, copied, onSave, saved }) {
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
