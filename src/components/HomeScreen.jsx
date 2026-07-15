import { useMemo } from 'react';
import { GENRE_COLORS, GENRE_LIST } from '../config.js';
import { OSHO_BOOKS } from '../data/oshoBooks.js';
import { BookCard } from './BookCard.jsx';
import { IcoX } from './Icons.jsx';
import { SeriesCard } from './SeriesCard.jsx';
import { SeriesImg } from './SeriesImg.jsx';

/* ── Home Screen ── */
export function HomeScreen({seriesList, dataLoading, onSeries, activePill, setActivePill, discLang, contentType, search, nowPlaying, audioPct, onResume, onDismissCL, savedSeries, onToggleSave, savedBooks, onToggleSaveBook, onReadBook, t, isDesktop}) {
  const isBooks = contentType === 'books';
  const isVideos = contentType === 'videos';

  const filtered = useMemo(() => {
    if (isBooks) return [];
    let list = activePill === 'all' ? seriesList : seriesList.filter(s => s.g === activePill);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s => s.n.toLowerCase().includes(q));
    }
    return list;
  }, [isBooks, seriesList, activePill, search]);

  const filteredBooks = useMemo(() => {
    if (!isBooks) return [];
    let list = activePill === 'all' ? OSHO_BOOKS : OSHO_BOOKS.filter(b => b.tag === activePill);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(b => b.n.toLowerCase().includes(q) || b.author.toLowerCase().includes(q));
    }
    return list;
  }, [isBooks, activePill, search]);

  const genres = useMemo(() => {
    if (isBooks) return [];
    const seen = new Set();
    seriesList.forEach(s => seen.add(s.g));
    return GENRE_LIST.filter(g => g !== 'all' && seen.has(g));
  }, [isBooks, seriesList]);

  const formats = useMemo(() => Array.from(new Set(OSHO_BOOKS.map(b => b.tag))), []);

  const pageTitle = isBooks ? t.allBooks : isVideos ? t.videosTab : t.allSeries;
  const itemCount = isBooks ? filteredBooks.length : filtered.length;

  return (
    <>
      <div className="desk-header">
        <h1>{pageTitle}<span className="desk-header-count">{itemCount} {isBooks ? 'books' : 'series'}</span></h1>
      </div>

      <div className="screen-body">
      {/* Continue Listening */}
      {!isBooks && nowPlaying && (
        <div style={{marginBottom:4, marginTop:16}}>
          <div className="sec-lbl">{t.continueListening}</div>
          <div className="cl-card" onClick={onResume}>
            <SeriesImg series={nowPlaying.series} className="cl-art" style={{width:60,height:60,borderRadius:12,border:'1px solid var(--border)',overflow:'hidden',flexShrink:0}}/>
            <div className="cl-info">
              <div className="cl-title-row">
                <span className="cl-title">{nowPlaying.series.n}</span>
                <span className="cl-pct-pill">{Math.round(audioPct)}% listened</span>
              </div>
              <div className="cl-ep">{nowPlaying.episode.t}</div>
              <div className="cl-prog"><div className="cl-prog-fill" style={{width:`${audioPct}%`}}/></div>
            </div>
            <div className="cl-actions">
              <button className="cl-close" onClick={e => { e.stopPropagation(); onDismissCL(); }}><IcoX/></button>
            </div>
          </div>
        </div>
      )}

      {/* Genre tiles — mobile only, discourses/videos */}
      {!isBooks && !search && (
        <div className="genre-section" style={{marginBottom:24, marginTop:16}}>
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

      {/* Filter pills — mobile only: genres for discourses/videos, format for books */}
      <div className="filter-scroll">
        <button className={`filter-pill ${activePill==='all'?'active':''}`} onClick={() => setActivePill('all')}>{t.all}</button>
        {isBooks
          ? formats.map(f => (
              <button key={f} className={`filter-pill ${activePill===f?'active':''}`} onClick={() => setActivePill(f)}>{f}</button>
            ))
          : genres.map(g => (
              <button key={g} className={`filter-pill ${activePill===g?'active':''}`} onClick={() => setActivePill(g)}>
                {t.genres[g] || g}
              </button>
            ))}
      </div>

      {/* Grid */}
      {!isDesktop && <div className="sec-lbl">{pageTitle}</div>}
      {isBooks ? (
        <div className="series-grid book-grid">
          {filteredBooks.length === 0 ? (
            <div className="empty-state">{t.noBooks}</div>
          ) : filteredBooks.map(b => (
            <BookCard key={b.i} b={b} saved={savedBooks.has(b.i)} onToggleSave={onToggleSaveBook} onRead={onReadBook}/>
          ))}
        </div>
      ) : (
        <div className="series-grid">
          {dataLoading ? (
            <div className="empty-state"><div className="loader-ring" style={{margin:'0 auto'}}/></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">{isVideos ? t.noVideos : t.noSeries}</div>
          ) : filtered.map(s => (
            <SeriesCard key={s.i} s={s} discLang={discLang} saved={savedSeries.has(s.i)} onOpen={onSeries} onToggleSave={onToggleSave} t={t}/>
          ))}
        </div>
      )}
      </div>

      <div className="footer-band">
        <div className="footer-wm">Osho<em>·</em></div>
        <div className="footer-attr">{t.footerAttribution}</div>
        <div className="footer-note">{t.footerNote}</div>
      </div>
    </>
  );
}
