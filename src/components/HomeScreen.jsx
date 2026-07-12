import { useMemo, useState } from 'react';
import { OSHO_DATA } from '../data/oshoData.js';
import { GENRE_COLORS, GENRE_LIST, seriesTotalDuration } from '../config.js';
import { IcoPlay, IcoSearch, IcoShare, IcoX } from './Icons.jsx';
import { IconLangButton } from './LanguageControls.jsx';
import { SeriesImg } from './SeriesImg.jsx';

/* ── Home Screen ── */
export function HomeScreen({seriesList, onSeries, activePill, setActivePill, lang, setLang, discLang, setDiscLang, nowPlaying, audioPct, onResume, onDismissCL, onShareApp, t, isDesktop}) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = activePill === 'all' ? seriesList : seriesList.filter(s => s.g === activePill);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s => s.n.toLowerCase().includes(q));
    }
    return list;
  }, [seriesList, activePill, search]);

  const genres = useMemo(() => {
    const seen = new Set();
    seriesList.forEach(s => seen.add(s.g));
    return GENRE_LIST.filter(g => g !== 'all' && seen.has(g));
  }, [seriesList]);

  return (
    <>
      {/* Mobile topbar */}
      <div className="topbar">
        <div className="topbar-wm">Osho<em>·</em></div>
        <div className="topbar-right">
          <button className="icon-btn-label" aria-label="Share" onClick={onShareApp}><IcoShare/><span>Share</span></button>
          <IconLangButton lang={lang} setLang={setLang} size={32}/>
        </div>
      </div>
      <div className="mob-disc-row">
        <span className="mob-disc-lbl">{t.discourseLang}</span>
        <div className="mob-disc">
          <button className={`mob-disc-btn ${discLang==='en'?'active':''}`} onClick={() => setDiscLang('en')}>{t.discEn}</button>
          <button className={`mob-disc-btn ${discLang==='hi'?'active':''}`} onClick={() => setDiscLang('hi')}>{t.discHi}</button>
        </div>
      </div>

      {/* Desktop header */}
      <div className="desk-header">
        <h1>{t.allSeries}<span className="desk-header-count">{filtered.length} series</span></h1>
        <div className="desk-header-right">
          <button className="icon-btn-label lg" aria-label="Share" onClick={onShareApp}><IcoShare s={16}/><span>Share</span></button>
          <IconLangButton lang={lang} setLang={setLang} size={36}/>
        </div>
      </div>

      <div className="screen-body">
      <div className="search-wrap">
        <div className="sbar">
          <span style={{color:'var(--muted)'}}><IcoSearch/></span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.search}/>
          {search && <button style={{background:'none',border:'none',cursor:'pointer',color:'var(--muted)',padding:0,display:'flex'}} onClick={() => setSearch('')}><IcoX/></button>}
        </div>
      </div>

      {/* Continue Listening */}
      {nowPlaying && (
        <div style={{marginBottom:4}}>
          <div className="sec-lbl">{t.continueListening}</div>
          <div className="cl-card" onClick={onResume}>
            <SeriesImg series={nowPlaying.series} className="cl-art" style={{width:60,height:60,borderRadius:12,border:'1px solid var(--border)',overflow:'hidden',flexShrink:0}}/>
            <div className="cl-info">
              <div className="cl-title">{nowPlaying.series.n}</div>
              <div className="cl-ep">{nowPlaying.episode.t}</div>
              <div className="cl-prog"><div className="cl-prog-fill" style={{width:`${audioPct}%`}}/></div>
              <div className="cl-pct">{Math.round(audioPct)}% listened</div>
            </div>
            <div className="cl-actions">
              <button className="cl-play" onClick={e => { e.stopPropagation(); onResume(); }}><IcoPlay s={16}/></button>
              <button className="cl-close" onClick={e => { e.stopPropagation(); onDismissCL(); }}><IcoX/></button>
            </div>
          </div>
        </div>
      )}

      {/* Genre tiles — mobile only */}
      {!search && (
        <div className="genre-section" style={{marginBottom:24}}>
          <div className="sec-lbl">{t.exploreTopic}</div>
          <div className="genre-scroll">
            {genres.map(g => (
              <div key={g} className="genre-tile" onClick={() => setActivePill(g)}>
                <div className={`genre-sq ${activePill===g?'active-genre':''}`} style={{background: GENRE_COLORS[g] || '#C0B8B0'}}>
                  <svg width="72" height="72" viewBox="0 0 80 80" style={{display:'block'}}>
                    <circle cx="40" cy="32" r="14" fill="rgba(32,19,23,0.16)"/>
                    <circle cx="40" cy="32" r="7" fill="rgba(32,19,23,0.30)"/>
                    <rect x="18" y="54" width="44" height="3" rx="1.5" fill="rgba(32,19,23,0.20)"/>
                  </svg>
                </div>
                <div className="genre-lbl">{t.genres[g] || g}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter pills — mobile only */}
      <div className="filter-scroll">
        <button className={`filter-pill ${activePill==='all'?'active':''}`} onClick={() => setActivePill('all')}>{t.all}</button>
        {genres.map(g => (
          <button key={g} className={`filter-pill ${activePill===g?'active':''}`} onClick={() => setActivePill(g)}>
            {t.genres[g] || g}
          </button>
        ))}
      </div>

      {/* Series grid */}
      {!isDesktop && <div className="sec-lbl">{t.allSeries}</div>}
      <div className="series-grid">
        {filtered.length === 0 ? (
          <div className="empty-state">{t.noSeries}</div>
        ) : filtered.map(s => (
          <div key={s.i} className="series-card" onClick={() => onSeries(s)}>
            <SeriesImg series={s} className="series-card-img"/>
            <div className="series-card-info">
              <div className="series-title">{s.n}</div>
              <div className="series-meta">{t.genres[s.g] || s.g}</div>
              {s.x && <div className="series-desc">{s.x}</div>}
              <div className="series-stats">
                <span className="stat-pill lang">{discLang === 'hi' ? 'Hindi' : 'English'}</span>
                <span className="stat-pill">{t.episodes(s.e.length)}</span>
                <span className="stat-pill">{seriesTotalDuration(s)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      </div>

      <div className="footer-band">
        <div className="footer-wm">Osho<em>·</em></div>
        <div className="footer-attr">{t.footerAttribution}</div>
        <div className="footer-note">{t.footerNote}</div>
      </div>
    </>
  );
}
