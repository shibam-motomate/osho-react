import { useEffect, useMemo, useRef, useState } from 'react';
import { EPISODE_COUNTS, GENRE_LIST } from '../config.js';
import { OSHO_QUOTES } from '../data/quotes.js';
import { OSHO_VIDEOS_EN, OSHO_VIDEOS_HI } from '../data/oshoVideos.js';
import { onActivateKey } from '../lib/a11y.js';
import { IcoCheck, IcoDown, IcoList, IcoPlay, IcoSearch, IcoX } from './Icons.jsx';
import { InstallBanner } from './HomeScreenGuide.jsx';
import { SeriesCard } from './SeriesCard.jsx';
import { SeriesImg } from './SeriesImg.jsx';

const VIDEO_COUNTS = {
  en: OSHO_VIDEOS_EN.reduce((a, s) => a + s.e.length, 0),
  hi: OSHO_VIDEOS_HI.reduce((a, s) => a + s.e.length, 0),
};
const fmtN = n => n.toLocaleString('en-IN');

/* ── Home: photo hero (continue listening, or a series to start with) with a search field
   that slides open to the left; language toggle with totals; topic chips; every series
   as a one-per-row list. ── */
export function HomeScreen({seriesList, dataLoading, onSeries, onPlayFirst, activePill, setActivePill, discLang, setDiscLang, contentType, search, setSearch, searchOpen, setSearchOpen,
  nowPlaying, audioPct, onResume, onDismissCL, savedSeries, onToggleSave, t, isDesktop}) {
  const isVideos = contentType === 'videos';
  const [quote] = useState(() => OSHO_QUOTES[Math.floor(Math.random() * OSHO_QUOTES.length)]);
  const inputRef = useRef(null);
  const [topicOpen, setTopicOpen] = useState(false);

  useEffect(() => {
    if (!topicOpen) return;
    const onKey = e => { if (e.key === 'Escape') setTopicOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [topicOpen]);

  // Focus the field only once the slide-open has finished, and without letting the browser
  // scroll the screen sideways to "reveal" a field that is still mid-animation.
  useEffect(() => {
    if (!searchOpen) return;
    const id = setTimeout(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus({preventScroll: true});
      for (let p = el.parentElement; p; p = p.parentElement) if (p.scrollLeft) p.scrollLeft = 0;
    }, 420);
    return () => clearTimeout(id);
  }, [searchOpen]);

  const filtered = useMemo(() => {
    let list = activePill === 'all' ? seriesList : seriesList.filter(s => s.g === activePill);
    if (search.trim()) {
      const q = search.toLowerCase();
      // Match the series name or any talk title inside it, so a remembered talk can be found too.
      list = list.filter(s => s.n.toLowerCase().includes(q) || s.e.some(e => e.t.toLowerCase().includes(q)));
    }
    return list;
  }, [seriesList, activePill, search]);

  const genres = useMemo(() => {
    const n = {};
    seriesList.forEach(s => { n[s.g] = (n[s.g] || 0) + 1; });
    return GENRE_LIST.filter(g => g !== 'all' && n[g]).map(g => ({g, n: n[g]}));
  }, [seriesList]);
  const topicName = g => g === 'all' ? t.all : (t.genres[g] || g);

  const counts = isVideos ? VIDEO_COUNTS : EPISODE_COUNTS;

  // Hero: what the listener was last playing. With nothing in progress, a random series —
  // a different one on every visit (and whenever the catalogue or language changes).
  const randomPick = useMemo(() => seriesList.length ? seriesList[Math.floor(Math.random() * seriesList.length)] : null, [seriesList]);
  const heroSeries = nowPlaying ? nowPlaying.series : randomPick;
  const heroIsContinue = !!nowPlaying;
  const heroTitle = heroIsContinue ? nowPlaying.episode.t : heroSeries?.n;
  const heroSub = heroIsContinue
    ? `${nowPlaying.series.n}${audioPct > 0 && audioPct < 100 ? ` · ${t.minLeft(Math.round((100 - audioPct) / 100 * durSecs(nowPlaying.episode.d) / 60))}` : ''}`
    : heroSeries ? `${t.genres[heroSeries.g] || heroSeries.g} · ${t.talks(heroSeries.e.length)}` : '';
  const heroAction = () => {
    if (heroIsContinue) onResume();
    else if (heroSeries) onPlayFirst(heroSeries);
  };
  const closeSearch = () => { setSearch(''); setSearchOpen(false); };

  const pageTitle = isVideos ? t.videosTab : t.allSeries;

  return (
    <>
      <div className="screen-body">
        {heroSeries && (
          <div className={`hero${searchOpen ? ' searching' : ''}`} role="button" tabIndex={0} onClick={() => !searchOpen && onSeries(heroSeries)} onKeyDown={onActivateKey(() => !searchOpen && onSeries(heroSeries))} aria-label={heroTitle}>
            <SeriesImg series={heroSeries} img={heroIsContinue ? nowPlaying.episode.img : undefined} className="hero-img" plain/>
            <div className="hero-shade"/>
            {/* Phone-only top row: wordmark + a search button that slides open to the left */}
            <div className="hero-top" onClick={e => e.stopPropagation()}>
              <span className="wordmark caps">OSHO</span>
              <div className="hero-top-right">
                <div className="seg on-photo" role="group" aria-label={isVideos ? t.videosIn : t.discourseLang}>
                  <button className={`seg-btn${discLang==='en'?' active':''}`} onClick={() => setDiscLang('en')} aria-pressed={discLang==='en'} tabIndex={searchOpen ? -1 : 0}>
                    EN<small>{fmtN(counts.en)}</small>
                  </button>
                  <button className={`seg-btn${discLang==='hi'?' active':''}`} onClick={() => setDiscLang('hi')} aria-pressed={discLang==='hi'} tabIndex={searchOpen ? -1 : 0}>
                    HI<small>{fmtN(counts.hi)}</small>
                  </button>
                </div>
              </div>
              <div className={`hsearch${searchOpen ? ' open' : ''}`}>
                <input ref={inputRef} value={search} onChange={e => setSearch(e.target.value)} placeholder={isVideos ? t.searchVideos : t.search}
                  aria-label={t.search} tabIndex={searchOpen ? 0 : -1}
                  onKeyDown={e => { if (e.key === 'Escape') closeSearch(); }}/>
                <button className="hsearch-btn" aria-label={searchOpen ? 'Close search' : 'Search'} aria-expanded={searchOpen}
                  onClick={() => searchOpen ? closeSearch() : setSearchOpen(true)}>
                  {searchOpen ? <IcoX s={22}/> : <IcoSearch s={22}/>}
                </button>
              </div>
            </div>
            {heroIsContinue && !searchOpen && (
              <button className="hero-icon hero-dismiss" aria-label="Dismiss" onClick={e => { e.stopPropagation(); onDismissCL(); }}><IcoX s={18}/></button>
            )}
            <div className="hero-bottom">
              <div className="hero-info">
                <div className="eyebrow">{heroIsContinue ? t.continueListening : t.startHere}</div>
                <div className="hero-title">{heroTitle}</div>
                <div className="hero-sub">{heroSub}</div>
                {heroIsContinue && <div className="hero-prog"><div className="hero-prog-fill" style={{width:`${audioPct}%`}}/></div>}
              </div>
              <button className="hero-play" aria-label={heroIsContinue ? t.continueBtn : t.playFromStart} onClick={e => { e.stopPropagation(); heroAction(); }} tabIndex={searchOpen ? -1 : 0}>
                <IcoPlay s={30}/>
              </button>
            </div>
          </div>
        )}

        {/* One-time "Add to your Home Screen" banner — phones not yet running from the Home Screen */}
        {!isDesktop && <InstallBanner t={t}/>}

        {/* Topic picker — phone only (desktop has the sidebar) */}
        {genres.length > 0 && (
          <div className="topic-bar">
            <button className="topic-btn" onClick={() => setTopicOpen(true)} aria-haspopup="dialog" aria-expanded={topicOpen} aria-label={`${t.topics}: ${topicName(activePill)}`}>
              <span className="topic-btn-ic"><IcoList s={24}/></span>
              <span className="topic-btn-txt">
                <span className="topic-btn-lbl">{t.topics}</span>
                <span className="topic-btn-val">{topicName(activePill)}{activePill !== 'all' ? ` · ${filtered.length} series` : ''}</span>
              </span>
              <span className="topic-btn-chev"><IcoDown s={26}/></span>
            </button>
          </div>
        )}

        <div className="sec-head">
          <h1 className="sec-title">
            {search.trim() ? `“${search.trim()}”` : activePill === 'all' ? pageTitle : (t.genres[activePill] || activePill)}
            <span className="sec-count">{filtered.length} series · {t.talks(filtered.reduce((a, s) => a + s.e.length, 0))}</span>
          </h1>
        </div>

        <div className="slist">
          {dataLoading ? (
            <div className="loading-state"><div className="loader-ring"/></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">{isVideos ? t.noVideos : t.noSeries}</div>
          ) : filtered.map(s => (
            <SeriesCard key={s.i} s={s} discLang={discLang} saved={savedSeries.has(s.i)} onOpen={onSeries} onToggleSave={onToggleSave} t={t}/>
          ))}
        </div>
      </div>

      <div className={`sheet-scrim${topicOpen ? ' open' : ''}`} onClick={() => setTopicOpen(false)}/>
      <div className={`sheet${topicOpen ? ' open' : ''}`} role="dialog" aria-modal="true" aria-label={t.topics} aria-hidden={!topicOpen}>
        <div className="sheet-handle"/>
        <div className="sheet-head">
          <div className="sheet-title">{t.topics}</div>
          <button className="icon-btn" onClick={() => setTopicOpen(false)} aria-label="Close"><IcoX s={18}/></button>
        </div>
        <div className="sheet-list">
          {[{g: 'all', n: seriesList.length}, ...genres].map(({g, n}) => (
            <button key={g} className={`sheet-row${activePill === g ? ' active' : ''}`} onClick={() => { setActivePill(g); setTopicOpen(false); }} aria-pressed={activePill === g} tabIndex={topicOpen ? 0 : -1}>
              <span className="sheet-row-check">{activePill === g && <IcoCheck s={20}/>}</span>
              <span className="sheet-row-name">{topicName(g)}</span>
              <span className="sheet-row-count">{n}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="footer-band">
        <div className="footer-quote">&ldquo;{quote}&rdquo; &mdash; Osho</div>
        <div className="footer-text">{t.footerAttribution} {t.footerNote} Icons by <a href="https://www.streamlinehq.com" target="_blank" rel="noopener">Streamline</a>.</div>
      </div>
    </>
  );
}

const durSecs = d => { const p = String(d || '0:00').split(':').map(Number); return p.length === 3 ? p[0]*3600 + p[1]*60 + p[2] : p[0]*60 + p[1]; };
