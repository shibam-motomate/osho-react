import { useEffect, useMemo, useRef, useState } from 'react';
import { EPISODE_COUNTS, GENRE_LIST, seriesTotalSeconds, talkCount } from '../config.js';
import { OSHO_QUOTES } from '../data/quotes.js';
import { OSHO_VIDEOS_EN, OSHO_VIDEOS_HI } from '../data/oshoVideos.js';
import { onActivateKey } from '../lib/a11y.js';
import { IcoCheck, IcoClock, IcoDown, IcoFilter, IcoList, IcoPlay, IcoSearch, IcoShuffle, IcoSortAZ, IcoSortCount, IcoSortZA, IcoX } from './Icons.jsx';
import { InstallBanner } from './HomeScreenGuide.jsx';
import { warmTalk } from '../lib/warmTalk.js';
import { SeriesCard } from './SeriesCard.jsx';
import { SeriesImg } from './SeriesImg.jsx';

const VIDEO_COUNTS = {
  en: OSHO_VIDEOS_EN.reduce((a, s) => a + s.e.length, 0),
  hi: OSHO_VIDEOS_HI.reduce((a, s) => a + s.e.length, 0),
};
const fmtN = n => n.toLocaleString('en-IN');

/* Ways to order the series list. Shuffle is the default, so every visit opens on a different mix. */
const SORTS = [
  {key: 'shuffle', label: 'Shuffle', icon: IcoShuffle},
  {key: 'az', label: 'A to Z', icon: IcoSortAZ},
  {key: 'za', label: 'Z to A', icon: IcoSortZA},
  {key: 'time', label: 'Longest first', icon: IcoClock},
  {key: 'count', label: 'Most talks', icon: IcoSortCount},
];
const SORT_KEY = 'osho_sort';
const readSort = () => {
  try { const v = localStorage.getItem(SORT_KEY); return SORTS.some(o => o.key === v) ? v : 'shuffle'; } catch { return 'shuffle'; }
};
const saveSort = v => { try { localStorage.setItem(SORT_KEY, v); } catch { /* private mode */ } };
const newSeed = () => Math.floor(Math.random() * 0x100000000);
// A fixed random rank per series id for one shuffle, so the order holds while the full
// catalogue replaces the light index a moment after first paint (FNV-1a plus a final mix).
const shuffleRank = (id, seed) => {
  let h = (2166136261 ^ seed) >>> 0;
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13;
  return h >>> 0;
};
const collators = {};
const collatorFor = lang => (collators[lang] ||= new Intl.Collator(lang === 'hi' ? 'hi' : 'en', {sensitivity: 'base', numeric: true}));

/* ── Home: photo hero (continue listening, or a series to start with) with a search field
   that slides open to the left; language toggle with totals; topic chips; every series
   as a one-per-row list. ── */
export function HomeScreen({seriesList, dataLoading, onSeries, onPlayFirst, activePill, setActivePill, discLang, setDiscLang, contentType, search, setSearch, searchOpen, setSearchOpen,
  nowPlaying, audioPct, onResume, onDismissCL, savedSeries, onToggleSave, t, isDesktop}) {
  const isVideos = contentType === 'videos';
  const [quote] = useState(() => OSHO_QUOTES[Math.floor(Math.random() * OSHO_QUOTES.length)]);
  const inputRef = useRef(null);
  const [topicOpen, setTopicOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [sort, setSort] = useState(readSort);
  const [seed, setSeed] = useState(newSeed);
  const sortInfo = SORTS.find(o => o.key === sort) || SORTS[0];
  const chooseSort = key => {
    // Picking Shuffle again deals a fresh order.
    if (key === 'shuffle') setSeed(newSeed());
    setSort(key);
    saveSort(key);
    setSortOpen(false);
  };

  useEffect(() => {
    if (!topicOpen && !sortOpen) return;
    const onKey = e => { if (e.key === 'Escape') { setTopicOpen(false); setSortOpen(false); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [topicOpen, sortOpen]);

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
      // (Talk titles are searchable once the full catalogue has arrived, a moment after first paint.)
      list = list.filter(s => s.n.toLowerCase().includes(q) || (s.e && s.e.some(e => e.t.toLowerCase().includes(q))));
    }
    const byName = collatorFor(discLang).compare;
    const keyed = list.map(s => ({s, k:
      sort === 'shuffle' ? shuffleRank(s.i, seed)
      : sort === 'time' ? -seriesTotalSeconds(s)
      : sort === 'count' ? -talkCount(s)
      : 0}));
    keyed.sort(sort === 'az' ? (a, b) => byName(a.s.n, b.s.n)
      : sort === 'za' ? (a, b) => byName(b.s.n, a.s.n)
      : (a, b) => (a.k - b.k) || byName(a.s.n, b.s.n));
    return keyed.map(x => x.s);
  }, [seriesList, activePill, search, sort, seed, discLang]);

  const genres = useMemo(() => {
    const n = {};
    seriesList.forEach(s => { n[s.g] = (n[s.g] || 0) + 1; });
    return GENRE_LIST.filter(g => g !== 'all' && n[g]).map(g => ({g, n: n[g]}));
  }, [seriesList]);
  const topicName = g => g === 'all' ? t.all : (t.genres[g] || g);

  const counts = isVideos ? VIDEO_COUNTS : EPISODE_COUNTS;

  // Hero: what the listener was last playing. With nothing in progress, a random series —
  // a different one on every visit (and whenever the catalogue or language changes).
  // The pick is remembered by id per list, so it survives the swap from the light index to the
  // full catalogue a moment after first paint (otherwise the hero would change and load a
  // second photo).
  const pickRef = useRef({});
  const pickKey = `${contentType}:${discLang}`;
  const randomPick = useMemo(() => {
    if (!seriesList.length) return null;
    const id = pickRef.current[pickKey];
    const kept = id && seriesList.find(s => s.i === id);
    if (kept) return kept;
    // First English pick uses the seed index.html used to preload this hero's photo (vite.config.js).
    const seed = pickKey === 'discourses:en' && typeof window.__heroSeed === 'number' ? window.__heroSeed : Math.random();
    const pick = seriesList[Math.floor(seed * seriesList.length)];
    pickRef.current[pickKey] = pick.i;
    return pick;
  }, [seriesList, pickKey]);
  const heroSeries = nowPlaying ? nowPlaying.series : randomPick;
  const heroIsContinue = !!nowPlaying;
  const heroTitle = heroIsContinue ? nowPlaying.episode.t : heroSeries?.n;
  const heroSub = heroIsContinue
    ? `${nowPlaying.series.n}${audioPct > 0 && audioPct < 100 ? ` · ${t.minLeft(Math.round((100 - audioPct) / 100 * durSecs(nowPlaying.episode.d) / 60))}` : ''}`
    : heroSeries ? `${t.genres[heroSeries.g] || heroSeries.g} · ${t.talks(talkCount(heroSeries))}` : '';
  // Warm up the hero's talk: the one to continue, or the series' first talk once the catalogue is in.
  const heroTalk = heroIsContinue ? nowPlaying.episode.u : heroSeries?.e?.[0]?.u;
  useEffect(() => { if (heroTalk && !isVideos) warmTalk(heroTalk); }, [heroTalk, isVideos]);
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
            <SeriesImg series={heroSeries} img={heroIsContinue ? nowPlaying.episode.img : undefined} className="hero-img" plain priority/>
            <div className="hero-shade"/>
            {/* Phone-only top row: wordmark + a search button that slides open to the left */}
            <div className="hero-top" onClick={e => e.stopPropagation()}>
              <span className="sig-shadow" role="img" aria-label="Osho"><span className="sig"/></span>
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
            <span className="sec-count">{filtered.length} series · {t.talks(filtered.reduce((a, s) => a + talkCount(s), 0))}</span>
          </h1>
          <button className="sort-btn" onClick={() => setSortOpen(true)} aria-haspopup="dialog" aria-expanded={sortOpen} aria-label={`Sort: ${sortInfo.label}`}>
            <IcoFilter s={18}/><span>{sortInfo.label}</span>
          </button>
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

      <div className={`sheet-scrim${sortOpen ? ' open' : ''}`} onClick={() => setSortOpen(false)}/>
      <div className={`sheet set-sheet${sortOpen ? ' open' : ''}`} role="dialog" aria-modal="true" aria-label="Sort series" aria-hidden={!sortOpen}>
        <div className="sheet-handle"/>
        <div className="sheet-head">
          <div className="sheet-title">Sort series</div>
          <button className="icon-btn" onClick={() => setSortOpen(false)} aria-label="Close" tabIndex={sortOpen ? 0 : -1}><IcoX s={18}/></button>
        </div>
        <div className="sheet-list">
          {SORTS.map(({key, label, icon: Icon}) => (
            <button key={key} className={`sheet-row${sort === key ? ' active' : ''}`} onClick={() => chooseSort(key)} aria-pressed={sort === key} tabIndex={sortOpen ? 0 : -1}>
              <span className="sheet-row-ic"><Icon s={20}/></span>
              <span className="sheet-row-name">{label}</span>
              <span className="sheet-row-check">{sort === key && <IcoCheck s={20}/>}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="footer-band">
        <div className="footer-quote">&ldquo;{quote}&rdquo; &mdash; Osho</div>
        <div className="footer-text">{t.footerAttribution} {t.footerNote} Icons by <a href="https://lucide.dev" target="_blank" rel="noopener">Lucide</a>.</div>
      </div>
    </>
  );
}

const durSecs = d => { const p = String(d || '0:00').split(':').map(Number); return p.length === 3 ? p[0]*3600 + p[1]*60 + p[2] : p[0]*60 + p[1]; };
