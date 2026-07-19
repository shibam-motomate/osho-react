import { useMemo, useState } from 'react';
import { GENRE_LIST } from '../config.js';
import { OSHO_BOOKS } from '../data/oshoBooks.js';
import { OSHO_QUOTES } from '../data/quotes.js';
import { onActivateKey } from '../lib/a11y.js';
import { BookCard } from './BookCard.jsx';
import { IcoPlay, IcoX } from './Icons.jsx';
import { SeriesCard } from './SeriesCard.jsx';
import { SeriesImg } from './SeriesImg.jsx';

/* ── Home Screen ── */
export function HomeScreen({seriesList, dataLoading, onSeries, onPlayFirst, activePill, setActivePill, discLang, contentType, search, nowPlaying, audioPct, onResume, onDismissCL, savedSeries, onToggleSave, savedBooks, onToggleSaveBook, onReadBook, t, isDesktop}) {
  const isBooks = contentType === 'books';
  const isVideos = contentType === 'videos';
  const [quote] = useState(() => OSHO_QUOTES[Math.floor(Math.random() * OSHO_QUOTES.length)]);
  const [quoteDismissed, setQuoteDismissed] = useState(false);

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

  const popular = useMemo(() => (isBooks || search.trim() ? [] : filtered.slice(0, 14)), [isBooks, search, filtered]);

  const pageTitle = isBooks ? t.allBooks : isVideos ? t.videosTab : t.allSeries;
  const itemCount = isBooks ? filteredBooks.length : filtered.length;

  const pillDefs = isBooks
    ? [{key: 'all', label: t.all}, ...formats.map(f => ({key: f, label: f}))]
    : [{key: 'all', label: t.all}, ...genres.map(g => ({key: g, label: t.genres[g] || g}))];

  return (
    <>
      <div className="desk-header">
        <h1>{pageTitle}<span className="desk-header-count">{itemCount} {isBooks ? 'books' : 'series'}</span></h1>
      </div>

      <div className="screen-body">
      {/* Daily Wisdom quote strip */}
      {!quoteDismissed && (
        <div className="quote-strip-wrap">
          <div className="quote-strip-border">
            <div className="quote-strip-inner">
              <span className="quote-strip-eyebrow">Daily Wisdom</span>
              <span className="quote-strip-text">&ldquo;{quote}&rdquo; <span className="quote-strip-attr">— Osho</span></span>
              <button className="quote-strip-close" aria-label="Dismiss quote" onClick={() => setQuoteDismissed(true)}><IcoX/></button>
            </div>
          </div>
        </div>
      )}

      {/* Continue Listening */}
      {!isBooks && nowPlaying && (
        <div style={{marginBottom:4, marginTop:4}}>
          <div className="sec-lbl">{t.continueListening}</div>
          <div className="cl-card" onClick={onResume}
            role="button" tabIndex={0} onKeyDown={onActivateKey(onResume)}>
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

      {/* Select Categories — desktop only */}
      {!isBooks && pillDefs.length > 1 && (
        <div className="cat-section">
          <div className="cat-heading">Select Categories</div>
          <div className="cat-scroll">
            {pillDefs.map(p => (
              <button key={p.key} className={`filter-pill ${activePill===p.key?'active':''}`} onClick={() => setActivePill(p.key)}>{p.label}</button>
            ))}
          </div>
        </div>
      )}

      {/* Popular series */}
      {popular.length > 0 && (
        <div className="popular-section">
          <div className="popular-heading">Popular series</div>
          <div className="popular-scroll">
            {popular.map(s => (
              <div key={s.i} className="popular-card" onClick={() => onSeries(s)}
                role="button" tabIndex={0} onKeyDown={onActivateKey(() => onSeries(s))}>
                <div className="popular-art">
                  <SeriesImg series={s} className="popular-img"/>
                  <button className="popular-play" aria-label="Play" onClick={e => { e.stopPropagation(); onPlayFirst?.(s); }}>
                    <IcoPlay s={17}/>
                  </button>
                </div>
                <div className="popular-title">{s.n}</div>
                <div className="popular-artist">{t.genres[s.g] || s.g}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter pills — mobile only: genres for discourses/videos, format for books */}
      <div className="filter-scroll">
        {pillDefs.map(p => (
          <button key={p.key} className={`filter-pill ${activePill===p.key?'active':''}`} onClick={() => setActivePill(p.key)}>{p.label}</button>
        ))}
      </div>

      {/* Grid */}
      {!isDesktop && <div className="sec-lbl">{pageTitle}</div>}
      {isDesktop && !isBooks && <div className="all-series-heading">All series</div>}
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
        <div className="footer-inner">
          <div className="footer-wm">Osho<em>·</em></div>
          <div className="footer-text">{t.footerAttribution} {t.footerNote}</div>
          <div className="footer-year">© {new Date().getFullYear()} Osho Discourses</div>
        </div>
      </div>
    </>
  );
}
