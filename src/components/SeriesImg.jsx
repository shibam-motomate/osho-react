import { useState } from 'react';
import { GENRE_COLORS, photoFor } from '../config.js';

/* Series artwork. `plain` renders a bare <img> (for full-bleed heroes and covers, where the
   CSS positions it) using the large photo; otherwise a wrapper box with the small photo
   filling it. On load error, a genre-coloured placeholder keeps the layout. */
export function SeriesImg({series, img, style, className, plain, priority = false}) {
  const [err, setErr] = useState(false);
  const c = GENRE_COLORS[series.g] || '#C0B8B0';
  const photo = img || series.img || photoFor(series, plain ? 'lg' : 'sm');
  if (err) return (
    <div className={className} style={{...style, background:c, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', position: plain ? undefined : 'relative'}} aria-hidden="true">
      <svg width="40%" viewBox="0 0 80 80" style={{display:'block'}}>
        <circle cx="40" cy="32" r="14" fill="rgba(32,19,23,0.16)"/>
        <circle cx="40" cy="32" r="7" fill="rgba(32,19,23,0.30)"/>
        <rect x="18" y="54" width="44" height="3" rx="1.5" fill="rgba(32,19,23,0.20)"/>
      </svg>
    </div>
  );
  // `priority`: the Home hero photo is the largest thing on the first screen, so ask for it first.
  if (plain) return <img className={className} src={photo} alt="" onError={() => setErr(true)} decoding="async" style={style}
    fetchpriority={priority ? 'high' : undefined}/>;
  return (
    <div className={className} style={{...style, position:'relative', overflow:'hidden'}}>
      <img src={photo} alt="" onError={() => setErr(true)} loading="lazy" decoding="async"
        style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center 22%',display:'block'}}/>
    </div>
  );
}
