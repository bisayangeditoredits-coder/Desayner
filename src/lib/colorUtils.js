// ─── Pure colour math (no deps) ───────────────────────────────────────────────

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}

export function rgbToHex([r,g,b]) {
  return [r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase();
}

export function getLum([r,g,b]) { return 0.299*r+0.587*g+0.114*b; }

export function hslToHex(h,s,l) {
  s/=100; l/=100;
  const a=s*Math.min(l,1-l);
  const f=n=>{ const k=(n+h/30)%12; const c=l-a*Math.max(Math.min(k-3,9-k,1),-1); return Math.round(255*c).toString(16).padStart(2,'0'); };
  return (f(0)+f(8)+f(4)).toUpperCase();
}

export function hexToHsl(hex) {
  let [r,g,b]=hexToRgb(hex); r/=255;g/=255;b/=255;
  const max=Math.max(r,g,b),min=Math.min(r,g,b);
  let h=0,s=0,l=(max+min)/2;
  if(max!==min){ const d=max-min; s=l>.5?d/(2-max-min):d/(max+min);
    if(max===r) h=((g-b)/d+(g<b?6:0))/6;
    else if(max===g) h=((b-r)/d+2)/6;
    else h=((r-g)/d+4)/6; }
  return [Math.round(h*360),Math.round(s*100),Math.round(l*100)];
}

export function hsvToHsl(h, s_hsv, v_hsv) {
  const s = s_hsv / 100;
  const v = v_hsv / 100;
  const l = v * (1 - s / 2);
  const s_hsl = (l === 0 || l === 1) ? 0 : (v - l) / Math.min(l, 1 - l);
  return [h, Math.round(s_hsl * 100), Math.round(l * 100)];
}

export function hslToHsv(h, s_hsl, l_hsl) {
  const s = s_hsl / 100;
  const l = l_hsl / 100;
  const v = l + s * Math.min(l, 1 - l);
  const s_hsv = v === 0 ? 0 : 2 * (1 - l / v);
  return [h, Math.round(s_hsv * 100), Math.round(v * 100)];
}

export function formatModel(name) {
  return name.split('_').map(w=>w[0].toUpperCase()+w.slice(1)).join(' ');
}

// ─── Export formats ───────────────────────────────────────────────────────────

export function buildExports(colors) {
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
