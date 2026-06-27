import { useState } from 'react';
import { GENRE_COLORS, photoFor } from '../config.js';

export function SeriesImg({series, style, className}) {
  const [err, setErr] = useState(false);
  const c = GENRE_COLORS[series.g] || '#C0B8B0';
  const photo = photoFor(series);
  if (err) return (
    <div className={className} style={{...style, background:c, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', position:'relative'}}>
      <svg width="55%" viewBox="0 0 80 80" style={{display:'block', opacity:0.5}}>
        <circle cx="40" cy="32" r="14" fill="rgba(255,255,255,0.4)"/>
        <circle cx="40" cy="32" r="7" fill="rgba(255,255,255,0.6)"/>
        <rect x="18" y="54" width="44" height="3" rx="1.5" fill="rgba(255,255,255,0.35)"/>
        <rect x="26" y="61" width="28" height="2" rx="1" fill="rgba(255,255,255,0.25)"/>
      </svg>
    </div>
  );
  return (
    <div className={className} style={{...style, position:'relative', overflow:'hidden'}}>
      <img src={photo} alt={series.n} onError={() => setErr(true)}
        style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center top',display:'block'}}/>
      <div style={{position:'absolute',inset:0,background:'linear-gradient(to bottom,transparent 50%,rgba(28,21,16,0.35))',pointerEvents:'none'}}/>
    </div>
  );
}
