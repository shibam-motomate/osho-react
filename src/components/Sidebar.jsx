import { useMemo } from 'react';
import { EPISODE_COUNTS, GENRE_COLORS, GENRE_LIST } from '../config.js';

/* ── Sidebar ── */
export function Sidebar({discLang, setDiscLang, activePill, setActivePill, t, seriesList}) {
  const genres = useMemo(() => {
    const seen = new Set();
    seriesList.forEach(s => seen.add(s.g));
    return GENRE_LIST.filter(g => g === 'all' || seen.has(g));
  }, [seriesList]);

  return (
    <aside className="sb">
      <div className="sb-logo">
        <div className="wordmark">Osho<em>·</em></div>
        <div className="wordmark-sub">Discourses</div>
      </div>
      <div className="sb-sec">
        <div className="sb-lbl">{t.discourseLang}</div>
        <div className="sb-disc">
          <button className={`sb-disc-btn ${discLang==='en'?'active':''}`} onClick={() => setDiscLang('en')}>
            {t.discEn}<span style={{fontSize:10,opacity:0.7,marginLeft:4}}>· {EPISODE_COUNTS.en}</span>
          </button>
          <button className={`sb-disc-btn ${discLang==='hi'?'active':''}`} onClick={() => setDiscLang('hi')}>
            {t.discHi}<span style={{fontSize:10,opacity:0.7,marginLeft:4}}>· {EPISODE_COUNTS.hi}</span>
          </button>
        </div>
      </div>
      <div className="sb-sec" style={{flex:1}}>
        <div className="sb-lbl">{t.exploreTopic}</div>
        <div className="sb-genres">
          {genres.map(g => {
            const c = GENRE_COLORS[g] || '#C0B8B0';
            return (
              <div key={g} className={`sb-genre-item ${activePill===g?'active':''}`} onClick={() => setActivePill(g)}>
                <div className="sb-genre-dot" style={{background: g==='all' ? 'var(--muted)' : c}}/>
                <span className="sb-genre-name">{g==='all' ? t.all : (t.genres[g] || g)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
