import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { T, isVideoId, photoFor } from './config.js';
import { FullPlayer } from './components/FullPlayer.jsx';
import { Header } from './components/Header.jsx';
import { HistoryScreen } from './components/HistoryScreen.jsx';
import { HomeScreen } from './components/HomeScreen.jsx';
import { MiniPlayer } from './components/MiniPlayer.jsx';
import { MobileNav } from './components/MobileNav.jsx';
import { SavedScreen } from './components/SavedScreen.jsx';
import { SeriesScreen } from './components/SeriesScreen.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { LoadScreen } from './components/LoadScreen.jsx';
import { useAuth } from './contexts/AuthContext.jsx';
import EN_INDEX from 'virtual:osho-index/en';
import { OSHO_BOOKS } from './data/oshoBooks.js';
import { OSHO_VIDEOS_EN, OSHO_VIDEOS_HI } from './data/oshoVideos.js';
import { installFocusAutoScroll, isTvDevice } from './lib/a11y.js';
import { readSpeed, saveSpeed } from './lib/playback.js';
import { getProgress, loadProgress, saveProgress } from './lib/progress.js';
import { warmTalk } from './lib/warmTalk.js';
import { attachVolume } from './lib/volume.js';
import { applyTheme, readTheme } from './lib/theme.js';
import { applyTextSize, readTextSize } from './lib/textsize.js';
import { supabase, supabaseEnabled } from './lib/supabaseClient.js';

const AccountScreen = lazy(() => import('./components/AccountScreen.jsx').then(m => ({default: m.AccountScreen})));
const AuthScreen = lazy(() => import('./components/AuthScreen.jsx').then(m => ({default: m.AuthScreen})));

const HISTORY_LIMIT = 60;

const PROFILE_SCREENS = ['saved', 'history', 'account'];

// Set once the first-visit load screen has been seen; later launches skip it.
const SEEN_KEY = 'osho_seen';

// The video library is Hindi-only for now (see src/data/oshoVideos.js) — if the
// discourse-language toggle is still on English when Videos is opened, there'd be
// nothing to show, so fall back to a language that actually has video content.
const videoLangWithContent = lang => ((lang === 'hi' ? OSHO_VIDEOS_HI : OSHO_VIDEOS_EN).length > 0 ? lang : 'hi');

// Supabase writes below are fire-and-forget (state is already updated locally/optimistically),
// but silently swallowing errors makes sync failures invisible — surface them in the console.
// Two-arg .then() form so both a resolved {error} and an outright rejected promise (e.g. a
// network failure) get logged instead of one of them vanishing silently.
const logSupaError = label => [
  result => { if (result?.error) console.error(`[supabase] ${label}:`, result.error); },
  err => console.error(`[supabase] ${label} (request failed):`, err),
];

function App() {
  const {user, authLoading, signOut} = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const visitedAccount = useRef(false);
  const [screen,      setScreen]    = useState('home');
  const [selSeries,   setSelSeries] = useState(null);
  const [lang,        setLang]      = useState('en');
  const [discLang,    setDiscLang]  = useState('en');
  const [activePill,  setPill]      = useState('all');
  // Read the saved talk before the first draw, so the Home hero starts on "Continue listening"
  // (and its photo, preloaded by index.html) instead of flashing a random series first.
  const [nowPlaying,  setNP]        = useState(() => { try { return JSON.parse(localStorage.getItem('osho_np') || 'null'); } catch (e) { return null; } });
  const [isPlaying,   setPlay]      = useState(false);
  const [playerOpen,  setPO]        = useState(false);
  const [clDismissed, setCLD]       = useState(false);
  const [audioPct,    setAudioPct]  = useState(0);
  const [isDesktop,   setIsDesktop] = useState(() => window.innerWidth >= 900);
  const [toast,       setToast]     = useState(null);
  const [theme,       setThemeState] = useState(readTheme); // 'dark' | 'light' — Account → Appearance
  const setTheme = useCallback(next => setThemeState(applyTheme(next)), []);
  const [textSize,    setTextSizeState] = useState(readTextSize); // 'normal' | 'large' | 'xlarge' — Account → Appearance
  const setTextSize = useCallback(next => setTextSizeState(applyTextSize(next)), []);
  const [playbackSpeed, setPlaybackSpeed] = useState(readSpeed); // remembered across launches
  const [sleepOption, setSleepOptionState] = useState('off'); // 'off' | 15 | 30 | 60 | 'end'
  const [sleepEndAt,  setSleepEndAt] = useState(null);
  const [sleepRemaining, setSleepRemaining] = useState(0);
  // First-load screen (wordmark + quote + progress, see LoadScreen): only on the very first
  // visit, until fonts and the first catalogue have arrived. Returning visitors go straight to
  // Home — its list shows its own loading state, and the catalogue is preloaded and cached.
  const [booting, setBooting] = useState(() => {
    try { return !localStorage.getItem(SEEN_KEY); } catch (e) { return false; }
  });
  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => {
    let on = true;
    const done = () => { if (on) setFontsReady(true); };
    if (document.fonts?.ready) document.fonts.ready.then(done); else done();
    const guard = setTimeout(done, 800); // never block on a slow font download
    return () => { on = false; clearTimeout(guard); };
  }, []);
  const [contentType, setContentType] = useState('discourses'); // 'discourses' | 'videos' | 'books'
  const [search, setSearch] = useState('');
  const [mobSearchOpen, setMobSearchOpen] = useState(false);
  const [savedSeries, setSavedSeries] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('osho_saved_series') || '[]')); } catch(e) { return new Set(); }
  });
  const [savedBooks, setSavedBooks] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('osho_saved_books') || '[]')); } catch(e) { return new Set(); }
  });
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('osho_history') || '[]'); } catch(e) { return []; }
  });
  const [savedEpisodes, setSavedEpisodes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('osho_saved_episodes') || '[]'); } catch(e) { return []; }
  });
  // Saved position of every talk ever started ({episodeUrl: {t, d, done}}, see lib/progress.js).
  // 'osho_np' / 'osho_time' below still track only the talk in the player for the Home hero.
  const [progress, setProgress] = useState(loadProgress);
  const [dataLoading, setDataLoading] = useState(false); // English index is in the bundle, so Home has its list at once
  const [seriesVersion, setSeriesVersion] = useState(0);
  const audioRef = useRef(null);
  const videoRef = useRef(null);
  const npRef = useRef(null); // nowPlaying, readable from timers and media-event handlers
  const toastTimer = useRef(null);
  const sleepOptionRef = useRef('off');
  const seriesCacheRef = useRef({}); // full catalogue per language (with talks), once loaded
  // Light series index per language (id, name, topic, talk count, length — see vite.config.js).
  // English ships in the main bundle, so Home draws its list and hero photo on first paint.
  const indexRef = useRef({en: EN_INDEX});
  const fullLoads = useRef({});
  const loadFull = useCallback(l => {
    if (seriesCacheRef.current[l]) return Promise.resolve(seriesCacheRef.current[l]);
    if (!fullLoads.current[l]) {
      fullLoads.current[l] = (l === 'hi' ? import('./data/oshoData.hi.js') : import('./data/oshoData.en.js'))
        .then(mod => {
          const list = l === 'hi' ? mod.OSHO_DATA_HI : mod.OSHO_DATA_EN;
          seriesCacheRef.current[l] = list;
          setSeriesVersion(v => v + 1);
          return list;
        })
        .catch(err => { delete fullLoads.current[l]; throw err; });
    }
    return fullLoads.current[l];
  }, []);
  const loadIndex = useCallback(l => {
    if (indexRef.current[l]) return Promise.resolve(indexRef.current[l]);
    return import('virtual:osho-index/hi').then(mod => {
      indexRef.current[l] = mod.default;
      setSeriesVersion(v => v + 1);
      return mod.default;
    });
  }, []);
  const speedRef = useRef(playbackSpeed);
  // Full player and the browser Back button: opening the player adds a history entry, so
  // Back (Android, browser, iOS swipe) closes it instead of leaving the screen behind it.
  const playerOpenRef = useRef(false);
  const ignorePopRef = useRef(false); // set when we call history.back() ourselves
  // Shown in the full and mini player when the current talk can't be loaded.
  const [mediaError, setMediaError] = useState(null);

  // Video episodes play through the <video> element (rendered visibly inside FullPlayer),
  // audio discourses through the hidden <audio> element — both stay permanently mounted
  // from the very first render (FullPlayer never unmounts its <video>) so a ref is always
  // valid the instant playback starts, even before FullPlayer has ever been opened.
  const mediaRefFor = useCallback(seriesId => (isVideoId(seriesId) ? videoRef : audioRef), []);
  useEffect(() => { npRef.current = nowPlaying; }, [nowPlaying]);
  // Apply the remembered volume to both media elements (they stay mounted for the app's life).
  useEffect(() => { attachVolume(audioRef, videoRef); }, []);

  // Write the position of the talk loaded in `el` to the per-talk progress map. Skipped while
  // metadata is still loading (readyState 0): currentTime is a meaningless 0 then, and the
  // resume seek in playEp has not been applied yet.
  const recordProgress = useCallback((el, url) => {
    if (!el || !url || el.readyState < 1) return;
    const next = saveProgress(url, el.currentTime, el.duration);
    if (next) setProgress(next);
  }, []);

  const sidebarMode = PROFILE_SCREENS.includes(screen) ? 'profile' : 'browse';

  const pushPath = path => {
    if (window.history.state?.oshoPlayer) window.history.replaceState({}, '', path);
    else window.history.pushState({}, '', path);
  };
  // Which tab screen Series was pushed from, so only that one dims/parallax-shifts
  // behind it (iOS push-navigation feel) — the other tabs stay put, untouched.
  const [pushedFrom, setPushedFrom] = useState('home');

  // Real URL navigation — pushes browser history so back/forward and
  // shareable links work, instead of just swapping in-memory screen state.
  // If the current entry is the full player's (see playerOpenRef), it's replaced rather than
  // stacked on, so Back from the new screen doesn't land on a stale player entry.
  const navigate = useCallback((nextScreen, series = null) => {
    if (nextScreen === 'series' && screen !== 'series') setPushedFrom(screen);
    setScreen(nextScreen);
    if (nextScreen === 'series' && series) setSelSeries(series);
    else if (nextScreen === 'home') setSelSeries(null);
    const path = nextScreen === 'series' ? `/series/${encodeURIComponent(series.i)}`
      : nextScreen === 'home' ? '/' : `/${nextScreen}`;
    if (window.location.pathname !== path) pushPath(path);
  }, [screen]);

  // Switching Discourses/Videos is its own top-level route (#/, #/videos), distinct from
  // navigate('home') which just returns to Home in whichever tab is active. (Books is
  // temporarily hidden from the UI, so it's not offered as a target here.)
  const selectContentType = useCallback(ct => {
    setContentType(ct);
    if (ct === 'videos') setDiscLang(videoLangWithContent);
    setScreen('home');
    setSelSeries(null);
    const path = ct === 'videos' ? '/videos' : '/';
    if (window.location.pathname !== path) pushPath(path);
  }, []);

  const resolveSeriesById = useCallback(async id => {
    if (isVideoId(id)) {
      for (const l of ['en', 'hi']) {
        const list = l === 'hi' ? OSHO_VIDEOS_HI : OSHO_VIDEOS_EN;
        const found = list.find(s => s.i === id);
        if (found) return {series: found, lang: l, pool: 'videos'};
      }
      return null;
    }
    for (const l of ['en', 'hi']) {
      const list = await loadFull(l);
      const found = list.find(s => s.i === id);
      if (found) return {series: found, lang: l, pool: 'discourses'};
    }
    return null;
  }, [loadFull]);

  // Parse the current URL into screen state, both on first load and on
  // browser back/forward navigation.
  useEffect(() => {
    const applyPath = async path => {
      if (path.startsWith('/series/')) {
        const found = await resolveSeriesById(decodeURIComponent(path.slice('/series/'.length)));
        if (found) {
          setDiscLang(found.lang);
          setContentType(found.pool);
          setSelSeries(found.series);
          setScreen('series');
          setSeriesVersion(v => v + 1);
        } else {
          setScreen('home');
        }
      } else if (path === '/saved' || path === '/history' || path === '/account') {
        setScreen(path.slice(1));
      } else if (path === '/videos') {
        setContentType('videos');
        setDiscLang(videoLangWithContent);
        setScreen('home');
      } else {
        setContentType('discourses');
        setScreen('home');
        // Covers stale/bookmarked links to hidden routes (e.g. /books) as well as any
        // other unrecognized path — land on Discourses home and fix up the URL to match.
        if (path !== '/') window.history.replaceState({}, '', '/');
      }
    };
    applyPath(window.location.pathname);
    const onPop = () => {
      if (ignorePopRef.current) { ignorePopRef.current = false; return; }
      if (playerOpenRef.current) { setPO(false); return; } // Back closes the full player
      applyPath(window.location.pathname);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [resolveSeriesById]);

  // Seeking before the browser has loaded metadata (readyState 0, common with
  // preload="none") is silently ignored, so defer the seek until it's ready.
  const seekWhenReady = useCallback((audio, time) => {
    if (!audio || !(time > 0)) return;
    if (audio.readyState >= 1) {
      audio.currentTime = time;
    } else {
      // Only seek if the same talk is still loaded — a quick switch to another talk must
      // not inherit this one's position.
      const src = audio.src;
      audio.addEventListener('loadedmetadata', () => { if (audio.src === src) audio.currentTime = time; }, { once: true });
    }
  }, []);

  const t = T[lang];

  // The list draws from the light index (instant for English, a tiny chunk for Hindi). The full
  // catalogue (talk titles, audio links) is fetched once the first screen is drawn, so it never
  // competes with the hero photo and fonts on a slow connection.
  useEffect(() => {
    let on = true;
    if (seriesCacheRef.current[discLang] || indexRef.current[discLang]) setDataLoading(false);
    else {
      setDataLoading(true);
      loadIndex(discLang).then(() => on && setDataLoading(false)).catch(() => {});
    }
    const start = () => { loadFull(discLang).catch(() => {}); };
    const idle = typeof window.requestIdleCallback === 'function'; // not in Safari
    const handle = idle ? window.requestIdleCallback(start, {timeout: 2500}) : setTimeout(start, 700);
    return () => { on = false; idle ? window.cancelIdleCallback(handle) : clearTimeout(handle); };
  }, [discLang, loadFull, loadIndex]);

  const discourseList = useMemo(() => seriesCacheRef.current[discLang] || indexRef.current[discLang] || [], [discLang, seriesVersion]);
  const videoList = useMemo(() => (discLang === 'hi' ? OSHO_VIDEOS_HI : OSHO_VIDEOS_EN), [discLang]);
  // Tagged with the language each series belongs to, so the Saved screen (which combines
  // both languages into one list) can label each card correctly regardless of the current
  // discLang toggle.
  const allDiscourseSeries = useMemo(() => [
    ...(seriesCacheRef.current.en || indexRef.current.en || []).map(s => ({...s, _lang: 'en'})),
    ...(seriesCacheRef.current.hi || indexRef.current.hi || []).map(s => ({...s, _lang: 'hi'})),
  ], [seriesVersion]);
  const allVideoSeries = useMemo(() => [
    ...OSHO_VIDEOS_EN.map(s => ({...s, _lang: 'en'})),
    ...OSHO_VIDEOS_HI.map(s => ({...s, _lang: 'hi'})),
  ], []);
  const seriesList = contentType === 'videos' ? videoList : contentType === 'books' ? [] : discourseList;
  const listLoading = contentType === 'discourses' ? dataLoading : false;

  // Hide splash loader once app has mounted
  useEffect(() => {
    const el = document.getElementById('loader');
    if (!el) return;
    el.classList.add('fade');
    const t = setTimeout(() => el.remove(), 300);
    return () => clearTimeout(t);
  }, []);

  // Fire TV/Silk and other TV browsers are D-pad-only (no mouse/touch) — flag it so
  // CSS can widen focus rings for 10-foot viewing, and so the media keyboard shortcuts
  // below know not to hijack arrow-key spatial navigation between cards.
  useEffect(() => {
    if (isTvDevice()) document.documentElement.classList.add('tv-mode');
  }, []);

  // Keep whatever's focused (via D-pad/keyboard) scrolled into view inside the nested
  // .screen scroll containers — see installFocusAutoScroll for why this can't be left
  // to the browser's default behavior.
  useEffect(() => installFocusAutoScroll(), []);

  // Reset genre/format filter and search when discourse language or content type changes
  useEffect(() => { setPill('all'); setSearch(''); setMobSearchOpen(false); }, [discLang, contentType]);

  useEffect(() => { sleepOptionRef.current = sleepOption; }, [sleepOption]);

  // Playback speed. Browsers reset playbackRate to defaultPlaybackRate whenever a new talk
  // loads, so set both — otherwise every talk after the first silently drops back to 1×.
  useEffect(() => {
    speedRef.current = playbackSpeed;
    [audioRef.current, videoRef.current].forEach(el => {
      if (!el) return;
      el.defaultPlaybackRate = playbackSpeed;
      el.playbackRate = playbackSpeed;
    });
    saveSpeed(playbackSpeed);
  }, [playbackSpeed]);

  // Full player ↔ browser history (see playerOpenRef).
  useEffect(() => {
    playerOpenRef.current = playerOpen;
    const onPlayerEntry = window.history.state?.oshoPlayer;
    if (playerOpen && !onPlayerEntry) {
      window.history.pushState({oshoPlayer: true}, '', window.location.href);
    } else if (!playerOpen && onPlayerEntry) {
      ignorePopRef.current = true;
      window.history.back();
    }
  }, [playerOpen]);

  // Sleep timer countdown
  useEffect(() => {
    if (!sleepEndAt) { setSleepRemaining(0); return; }
    const iv = setInterval(() => {
      const remaining = Math.max(0, Math.round((sleepEndAt - Date.now()) / 1000));
      setSleepRemaining(remaining);
      if (remaining <= 0) {
        if (audioRef.current) audioRef.current.pause();
        if (videoRef.current) videoRef.current.pause();
        setSleepOptionState('off');
        setSleepEndAt(null);
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [sleepEndAt]);

  // Resize listener
  useEffect(() => {
    const h = () => setIsDesktop(window.innerWidth >= 900);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  // Restore last session
  useEffect(() => {
    try {
      const saved = localStorage.getItem('osho_np');
      if (saved) {
        const np = JSON.parse(saved);
        setNP(np);
        const media = mediaRefFor(np.series.i).current;
        if (media) {
          media.src = np.episode.u;
          const t = parseFloat(localStorage.getItem('osho_time') || '0');
          seekWhenReady(media, t);
        }
      }
    } catch(e) {}
  }, [seekWhenReady, mediaRefFor]);

  // Persist position every 5s — whichever of audio/video is actually playing. Both the
  // current-talk slot ('osho_time') and the per-talk progress map are written here.
  useEffect(() => {
    const iv = setInterval(() => {
      const el = audioRef.current && !audioRef.current.paused ? audioRef.current
        : videoRef.current && !videoRef.current.paused ? videoRef.current : null;
      if (!el || el.readyState < 1) return;
      localStorage.setItem('osho_time', String(el.currentTime));
      const np = npRef.current;
      if (np && el === mediaRefFor(np.series.i).current) recordProgress(el, np.episode.u);
    }, 5000);
    return () => clearInterval(iv);
  }, [mediaRefFor, recordProgress]);

  // Leaving the page (tab closed, app backgrounded on a phone) — don't lose up to 5 s.
  useEffect(() => {
    const flush = () => {
      const np = npRef.current;
      if (np) recordProgress(mediaRefFor(np.series.i).current, np.episode.u);
    };
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, [mediaRefFor, recordProgress]);

  // Mini player / continue-listening progress — both elements stay mounted, so listen on
  // both; only the one actually playing will ever fire timeupdate. The lock-screen scrubber
  // (Media Session position state) is fed from the same event.
  useEffect(() => {
    const onTime = e => {
      const {currentTime, duration, playbackRate} = e.target;
      if (duration > 0) setAudioPct((currentTime / duration) * 100);
      const ms = 'mediaSession' in navigator ? navigator.mediaSession : null;
      if (ms?.setPositionState && Number.isFinite(duration) && duration > 0) {
        try { ms.setPositionState({duration, playbackRate, position: Math.min(Math.max(0, currentTime), duration)}); } catch (err) {}
      }
    };
    const els = [audioRef.current, videoRef.current].filter(Boolean);
    els.forEach(el => el.addEventListener('timeupdate', onTime));
    return () => els.forEach(el => el.removeEventListener('timeupdate', onTime));
  }, []);

  // Sync play/pause state + auto-next
  const onNext = useCallback(() => {
    if (!nowPlaying) return;
    const eps = nowPlaying.series.e;
    const idx = eps.findIndex(e => e.u === nowPlaying.episode.u);
    if (idx < eps.length - 1) playEp(nowPlaying.series, eps[idx + 1]);
  }, [nowPlaying]);

  useEffect(() => {
    const ms = 'mediaSession' in navigator ? navigator.mediaSession : null;
    const setMsState = state => { if (ms) { try { ms.playbackState = state; } catch (err) {} } };
    // Save the paused/finished talk's position — but only for the element that holds the
    // current talk (the other element is paused whenever playback switches between them).
    const saveFrom = el => {
      const np = npRef.current;
      if (!np || el !== mediaRefFor(np.series.i).current) return;
      recordProgress(el, np.episode.u);
      if (el.readyState >= 1) localStorage.setItem('osho_time', String(el.currentTime)); // Home hero resumes exactly here
    };
    const onPlay  = e => {
      setPlay(true); setMsState('playing');
      if (e.target.playbackRate !== speedRef.current) e.target.playbackRate = speedRef.current;
    };
    // A talk that can't load (offline, archive.org down, file gone) used to fail silently.
    const onError = e => {
      const el = e.target, np = npRef.current;
      if (!np || el !== mediaRefFor(np.series.i).current || !el.getAttribute('src')) return;
      if (el.error?.code === 1) return; // MEDIA_ERR_ABORTED: superseded by a newer talk
      setPlay(false); setMsState('paused');
      setMediaError(navigator.onLine === false
        ? "You're offline. Connect to the internet and try again."
        : "This talk couldn't be loaded. Please try again.");
    };
    const onLoadStart = () => setMediaError(null);
    const onPause = e => { setPlay(false); setMsState('paused'); saveFrom(e.target); };
    const onEnded = e => {
      saveFrom(e.target);
      if (sleepOptionRef.current === 'end') {
        setSleepOptionState('off');
        setSleepEndAt(null);
        return;
      }
      onNext();
    };
    const els = [audioRef.current, videoRef.current].filter(Boolean);
    els.forEach(el => {
      el.addEventListener('play', onPlay);
      el.addEventListener('pause', onPause);
      el.addEventListener('ended', onEnded);
      el.addEventListener('error', onError);
      el.addEventListener('loadstart', onLoadStart);
      el.addEventListener('playing', onLoadStart);
    });
    return () => els.forEach(el => {
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('error', onError);
      el.removeEventListener('loadstart', onLoadStart);
      el.removeEventListener('playing', onLoadStart);
    });
  }, [onNext, mediaRefFor, recordProgress]);

  const playEp = useCallback((series, episode) => {
    // Bank the outgoing talk's position first: swapping src does not reliably fire 'pause'.
    const prev = npRef.current;
    if (prev) recordProgress(mediaRefFor(prev.series.i).current, prev.episode.u);
    const np = {series, episode};
    setNP(np);
    setCLD(false);
    // A talk with a saved position picks up where it was left; a finished one starts over.
    const saved = getProgress(episode.u);
    const resumeAt = saved && !saved.done && saved.t > 0 ? saved.t : 0;
    localStorage.setItem('osho_np', JSON.stringify(np));
    localStorage.setItem('osho_time', String(resumeAt));
    const media = mediaRefFor(series.i).current;
    const other = media === videoRef.current ? audioRef.current : videoRef.current;
    if (other) other.pause();
    if (media) {
      media.src = episode.u;
      media.currentTime = 0;
      if (resumeAt) seekWhenReady(media, resumeAt);
      media.play().catch(() => {});
    }
    setHistory(prev => {
      const entry = {seriesId: series.i, seriesName: series.n, episodeUrl: episode.u, episodeTitle: episode.t, discLang, playedAt: Date.now()};
      const next = [entry, ...prev.filter(h => h.episodeUrl !== episode.u)].slice(0, HISTORY_LIMIT);
      try { localStorage.setItem('osho_history', JSON.stringify(next)); } catch(e) {}
      if (supabaseEnabled && user) {
        supabase.from('listening_history').upsert({
          user_id: user.id, series_id: series.i, series_name: series.n,
          episode_url: episode.u, episode_title: episode.t, disc_lang: discLang, played_at: new Date(entry.playedAt).toISOString(),
        }, {onConflict: 'user_id,episode_url'}).then(...logSupaError('save history entry'));
      }
      return next;
    });
  }, [discLang, user, mediaRefFor, recordProgress, seekWhenReady]);

  // Shared resolver for anything stored as {seriesId, episodeUrl, discLang} —
  // history entries and saved episodes both use this shape.
  const playEntry = useCallback(async entry => {
    const pool = isVideoId(entry.seriesId) ? 'videos' : 'discourses';
    let list;
    if (pool === 'videos') {
      list = entry.discLang === 'hi' ? OSHO_VIDEOS_HI : OSHO_VIDEOS_EN;
    } else {
      list = await loadFull(entry.discLang);
    }
    const series = list.find(s => s.i === entry.seriesId);
    const episode = series?.e.find(e => e.u === entry.episodeUrl);
    if (!series || !episode) return;
    setDiscLang(entry.discLang);
    setContentType(pool);
    playEp(series, episode);
    setPO(true);
    navigate('home');
  }, [playEp, navigate, loadFull]);

  // Index entries have no talks yet: fetch the full series before opening or playing it.
  const fullSeries = useCallback(async s => (s.e ? s : (await resolveSeriesById(s.i))?.series || null), [resolveSeriesById]);
  const openSeries = useCallback(async s => { const full = await fullSeries(s); if (full) navigate('series', full); }, [fullSeries, navigate]);
  const playFirst = useCallback(async s => { const full = await fullSeries(s); if (full?.e?.length) { playEp(full, full.e[0]); setPO(true); } }, [fullSeries, playEp]);

  const onTogglePlay = useCallback(() => {
    if (!nowPlaying) return;
    const media = mediaRefFor(nowPlaying.series.i).current;
    if (!media) return;
    isPlaying ? media.pause() : media.play().catch(() => {});
  }, [isPlaying, nowPlaying, mediaRefFor]);

  // Previous works like every music/podcast app: more than a few seconds into a talk it goes
  // back to the start of that talk; near the start (or on the first talk) it goes back a talk.
  const onPrev = useCallback(() => {
    if (!nowPlaying) return;
    const media = mediaRefFor(nowPlaying.series.i).current;
    const eps = nowPlaying.series.e;
    const idx = eps.findIndex(e => e.u === nowPlaying.episode.u);
    if (idx <= 0 || (media && media.currentTime > 5)) {
      if (media) media.currentTime = 0;
      return;
    }
    playEp(nowPlaying.series, eps[idx - 1]);
  }, [nowPlaying, playEp, mediaRefFor]);

  // "Try again" after a load error: reload the same talk from its saved position.
  const retryPlay = useCallback(() => {
    const np = npRef.current;
    if (!np) return;
    setMediaError(null);
    playEp(np.series, np.episode);
  }, [playEp]);

  const onSeekSeconds = useCallback(delta => {
    if (!nowPlaying) return;
    const media = mediaRefFor(nowPlaying.series.i).current;
    if (media) media.currentTime = Math.max(0, media.currentTime + delta);
  }, [nowPlaying, mediaRefFor]);

  // Lock-screen / headphone / car controls via the Media Session API. Everything is
  // feature-checked, so browsers without it (or without a given action) are unaffected.
  useEffect(() => {
    const ms = 'mediaSession' in navigator ? navigator.mediaSession : null;
    if (!ms) return;
    if (!nowPlaying) {
      try { ms.metadata = null; ms.playbackState = 'none'; } catch (err) {}
      return;
    }
    const {series, episode} = nowPlaying;
    const art = isVideoId(series.i) ? (episode.img || series.img || photoFor(series, 'lg')) : photoFor(series, 'lg');
    try {
      ms.metadata = new window.MediaMetadata({title: episode.t, artist: 'Osho', album: series.n, artwork: art ? [{src: art}] : []});
    } catch (err) {}
  }, [nowPlaying]);

  useEffect(() => {
    const ms = 'mediaSession' in navigator ? navigator.mediaSession : null;
    if (!ms || typeof ms.setActionHandler !== 'function') return;
    const media = () => (nowPlaying ? mediaRefFor(nowPlaying.series.i).current : null);
    const handlers = {
      play: () => { const el = media(); if (el) el.play().catch(() => {}); },
      pause: () => { const el = media(); if (el) el.pause(); },
      previoustrack: () => onPrev(),
      nexttrack: () => onNext(),
      seekbackward: d => onSeekSeconds(-(d?.seekOffset || 10)),
      seekforward: d => onSeekSeconds(d?.seekOffset || 10),
      seekto: d => {
        const el = media();
        if (!el || !(d?.seekTime >= 0)) return;
        if (d.fastSeek && typeof el.fastSeek === 'function') el.fastSeek(d.seekTime); else el.currentTime = d.seekTime;
      },
    };
    const actions = Object.keys(handlers);
    actions.forEach(a => { try { ms.setActionHandler(a, nowPlaying ? handlers[a] : null); } catch (err) {} });
    return () => actions.forEach(a => { try { ms.setActionHandler(a, null); } catch (err) {} });
  }, [nowPlaying, onPrev, onNext, onSeekSeconds, mediaRefFor]);

  const setSleepOption = useCallback(opt => {
    setSleepOptionState(opt);
    setSleepEndAt(opt === 'off' || opt === 'end' ? null : Date.now() + opt * 60000);
    setSleepRemaining(opt === 'off' || opt === 'end' ? 0 : opt * 60); // show the full time at once, not 0:00 until the first tick
  }, []);

  // Keyboard shortcuts: Space play/pause, Left/Right seek 10s. On TV browsers these
  // keys double as the D-pad's spatial-navigation input, so there they're only treated
  // as playback shortcuts while the full player is open and focus isn't on a control
  // that should handle Space/Enter/Left/Right itself (buttons, cards, etc.) — otherwise
  // they'd hijack the remote and make it impossible to navigate between cards.
  useEffect(() => {
    const handler = e => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || !nowPlaying) return;
      const isTv = document.documentElement.classList.contains('tv-mode');
      if (isTv) {
        const isControl = tag === 'button' || tag === 'a' || e.target.closest?.('[role="button"], [tabindex]');
        if (!playerOpen || isControl) return;
      }
      if (e.code === 'Space') { e.preventDefault(); onTogglePlay(); }
      else if (e.code === 'ArrowRight') { e.preventDefault(); onSeekSeconds(10); }
      else if (e.code === 'ArrowLeft') { e.preventDefault(); onSeekSeconds(-10); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [nowPlaying, onTogglePlay, onSeekSeconds, playerOpen]);

  const episodeIndex = nowPlaying ? nowPlaying.series.e.findIndex(e => e.u === nowPlaying.episode.u) : -1;
  const nextEpisode = nowPlaying && episodeIndex >= 0 && episodeIndex < nowPlaying.series.e.length - 1
    ? nowPlaying.series.e[episodeIndex + 1] : null;

  // Warm up the next talk a little after this one starts, so Next and auto-play start faster.
  useEffect(() => {
    if (!nextEpisode || !isPlaying) return;
    const id = setTimeout(() => warmTalk(nextEpisode.u), 20000);
    return () => clearTimeout(id);
  }, [nextEpisode, isPlaying]);

  const onResume = () => {
    if (!nowPlaying) return;
    const media = mediaRefFor(nowPlaying.series.i).current;
    const saved = parseFloat(localStorage.getItem('osho_time') || '0');
    seekWhenReady(media, saved);
    setPO(true);
    if (media) media.play().catch(() => {});
  };

  const closeMini = useCallback(() => {
    if (audioRef.current) audioRef.current.pause();
    if (videoRef.current) videoRef.current.pause();
    setNP(null); setPlay(false); setPO(false);
    try { localStorage.removeItem('osho_np'); localStorage.removeItem('osho_time'); } catch(e) {}
  }, []);

  const showToast = useCallback(msg => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const onReadBook = useCallback(book => {
    if (book.archiveId) {
      window.open(`https://archive.org/details/${book.archiveId}`, '_blank', 'noopener');
    } else {
      showToast(t.readComingSoon);
    }
  }, [t, showToast]);

  const shareApp = useCallback(() => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({title: 'Osho Discourses', url}).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => showToast(t.linkCopied)).catch(() => showToast(t.linkCopied));
    } else {
      showToast(t.linkCopied);
    }
  }, [t, showToast]);

  const bootProgress = 15 + (fontsReady ? 35 : 0) + (!dataLoading ? 50 : 0);
  const finishBoot = useCallback(() => {
    setBooting(false);
    try { localStorage.setItem(SEEN_KEY, '1'); } catch (e) {}
  }, []);

  const toggleSaveSeries = useCallback(id => {
    setSavedSeries(prev => {
      const next = new Set(prev);
      const willSave = !next.has(id);
      willSave ? next.add(id) : next.delete(id);
      try { localStorage.setItem('osho_saved_series', JSON.stringify(Array.from(next))); } catch(e) {}
      if (supabaseEnabled && user) {
        if (willSave) {
          supabase.from('saved_series').upsert({user_id: user.id, series_id: id}, {onConflict: 'user_id,series_id'}).then(...logSupaError('save series'));
        } else {
          supabase.from('saved_series').delete().eq('user_id', user.id).eq('series_id', id).then(...logSupaError('unsave series'));
        }
      }
      return next;
    });
  }, [user]);

  // Saved books are local-device only for now (no backend table for them yet)
  const toggleSaveBook = useCallback(id => {
    setSavedBooks(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      try { localStorage.setItem('osho_saved_books', JSON.stringify(Array.from(next))); } catch(e) {}
      return next;
    });
  }, []);

  // On login, merge the account's saved series with whatever is saved locally
  // (guest usage before signing in), then push any local-only saves up.
  useEffect(() => {
    if (!supabaseEnabled || !user) return;
    let cancelled = false;
    (async () => {
      const {data, error} = await supabase.from('saved_series').select('series_id').eq('user_id', user.id);
      if (error) console.error('[supabase] fetch saved series:', error);
      if (cancelled || error) return;
      const remoteIds = new Set((data || []).map(r => r.series_id));
      setSavedSeries(prev => {
        const toPush = Array.from(prev).filter(id => !remoteIds.has(id));
        if (toPush.length) {
          supabase.from('saved_series')
            .upsert(toPush.map(series_id => ({user_id: user.id, series_id})), {onConflict: 'user_id,series_id'}).then(...logSupaError('push local saved series'));
        }
        const merged = new Set([...prev, ...remoteIds]);
        try { localStorage.setItem('osho_saved_series', JSON.stringify(Array.from(merged))); } catch(e) {}
        return merged;
      });
    })();
    return () => { cancelled = true; };
  }, [user]);

  const toggleSaveEpisode = useCallback((series, episode) => {
    setSavedEpisodes(prev => {
      const exists = prev.some(e => e.episodeUrl === episode.u);
      const next = exists
        ? prev.filter(e => e.episodeUrl !== episode.u)
        : [{seriesId: series.i, seriesName: series.n, episodeUrl: episode.u, episodeTitle: episode.t, duration: episode.d, discLang}, ...prev];
      try { localStorage.setItem('osho_saved_episodes', JSON.stringify(next)); } catch(e) {}
      if (supabaseEnabled && user) {
        if (!exists) {
          supabase.from('saved_episodes').upsert({
            user_id: user.id, series_id: series.i, series_name: series.n,
            episode_url: episode.u, episode_title: episode.t, duration: episode.d, disc_lang: discLang,
          }, {onConflict: 'user_id,episode_url'}).then(...logSupaError('save episode'));
        } else {
          supabase.from('saved_episodes').delete().eq('user_id', user.id).eq('episode_url', episode.u).then(...logSupaError('unsave episode'));
        }
      }
      return next;
    });
  }, [user, discLang]);

  // On login, merge the account's saved episodes with whatever is saved locally.
  useEffect(() => {
    if (!supabaseEnabled || !user) return;
    let cancelled = false;
    (async () => {
      const {data, error} = await supabase.from('saved_episodes').select('*').eq('user_id', user.id);
      if (error) console.error('[supabase] fetch saved episodes:', error);
      if (cancelled || error) return;
      const remote = (data || []).map(r => ({seriesId: r.series_id, seriesName: r.series_name, episodeUrl: r.episode_url, episodeTitle: r.episode_title, duration: r.duration, discLang: r.disc_lang}));
      const remoteUrls = new Set(remote.map(r => r.episodeUrl));
      setSavedEpisodes(prev => {
        const toPush = prev.filter(e => !remoteUrls.has(e.episodeUrl));
        if (toPush.length) {
          supabase.from('saved_episodes').upsert(toPush.map(e => ({
            user_id: user.id, series_id: e.seriesId, series_name: e.seriesName,
            episode_url: e.episodeUrl, episode_title: e.episodeTitle, duration: e.duration, disc_lang: e.discLang,
          })), {onConflict: 'user_id,episode_url'}).then(...logSupaError('push local saved episodes'));
        }
        const merged = [...toPush, ...remote];
        try { localStorage.setItem('osho_saved_episodes', JSON.stringify(merged)); } catch(e) {}
        return merged;
      });
    })();
    return () => { cancelled = true; };
  }, [user]);

  // On login, merge the account's listening history with whatever is local, keeping
  // the most recent playedAt per episode, then push any local-only entries up.
  useEffect(() => {
    if (!supabaseEnabled || !user) return;
    let cancelled = false;
    (async () => {
      const {data, error} = await supabase.from('listening_history').select('*').eq('user_id', user.id);
      if (error) console.error('[supabase] fetch history:', error);
      if (cancelled || error) return;
      const remote = (data || []).map(r => ({seriesId: r.series_id, seriesName: r.series_name, episodeUrl: r.episode_url, episodeTitle: r.episode_title, discLang: r.disc_lang, playedAt: new Date(r.played_at).getTime()}));
      setHistory(prev => {
        const byUrl = new Map();
        for (const h of [...prev, ...remote]) {
          const existing = byUrl.get(h.episodeUrl);
          if (!existing || h.playedAt > existing.playedAt) byUrl.set(h.episodeUrl, h);
        }
        const merged = Array.from(byUrl.values()).sort((a, b) => b.playedAt - a.playedAt).slice(0, HISTORY_LIMIT);
        const remoteUrls = new Set(remote.map(r => r.episodeUrl));
        const toPush = merged.filter(h => !remoteUrls.has(h.episodeUrl));
        if (toPush.length) {
          supabase.from('listening_history').upsert(toPush.map(h => ({
            user_id: user.id, series_id: h.seriesId, series_name: h.seriesName,
            episode_url: h.episodeUrl, episode_title: h.episodeTitle, disc_lang: h.discLang, played_at: new Date(h.playedAt).toISOString(),
          })), {onConflict: 'user_id,episode_url'}).then(...logSupaError('push local history'));
        }
        try { localStorage.setItem('osho_history', JSON.stringify(merged)); } catch(e) {}
        return merged;
      });
    })();
    return () => { cancelled = true; };
  }, [user]);

  // The Account screen is usable without logging in (Appearance, Saved, History live there);
  // it just offers a Sign in button instead of account details. Apply the saved theme on mount.
  useEffect(() => { applyTheme(theme); }, [theme]);
  useEffect(() => { applyTextSize(textSize); }, [textSize]);

  const removeHistoryEntry = useCallback(episodeUrl => {
    setHistory(prev => {
      const next = prev.filter(h => h.episodeUrl !== episodeUrl);
      try { localStorage.setItem('osho_history', JSON.stringify(next)); } catch(e) {}
      return next;
    });
    if (supabaseEnabled && user) {
      supabase.from('listening_history').delete().eq('user_id', user.id).eq('episode_url', episodeUrl).then(...logSupaError('remove history entry'));
    }
  }, [user]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try { localStorage.setItem('osho_history', '[]'); } catch(e) {}
    if (supabaseEnabled && user) {
      supabase.from('listening_history').delete().eq('user_id', user.id).then(...logSupaError('clear history'));
    }
  }, [user]);

  const savedEpisodeUrls = useMemo(() => new Set(savedEpisodes.map(e => e.episodeUrl)), [savedEpisodes]);

  const appFont = lang === 'hi' ? 'var(--font-hi)' : lang === 'bn' ? 'var(--font-bn)' : 'var(--font)';
  // Tab screens (Home/Saved/History/Account) switch with a quick cross-fade — no
  // horizontal slide — matching how a native iOS tab bar swaps content. Series is the
  // one "pushed" detail view, which keeps the slide-in-from-right + dim-the-origin-tab feel.
  const tabClass = name => {
    const base = 'screen tab-screen';
    if (isDesktop) return `${base} ${screen === name ? 'desk-show' : ''}`;
    if (screen === name) return base;
    if (screen === 'series' && pushedFrom === name) return `${base} behind`;
    return `${base} tab-hidden`;
  };
  const homeClass  = tabClass('home');
  const savedClass = tabClass('saved');
  const histClass  = tabClass('history');
  const acctClass  = tabClass('account');
  const serClass   = `screen${!isDesktop ? (screen !== 'series' ? ' hidden' : '') : ''} ${isDesktop && screen === 'series' ? 'desk-show' : ''}`;

  return (
    <div id="app" className={`${playerOpen ? 'player-open' : ''}${nowPlaying ? ' has-np' : ''}`} style={{fontFamily:appFont}}>
      <audio ref={audioRef} preload="none" style={{display:'none'}}/>
      <Header t={t} contentType={contentType} onSelectContentType={selectContentType} search={search} setSearch={setSearch} discLang={discLang} setDiscLang={setDiscLang}
        onOpenSaved={() => navigate('saved')} onLogoClick={() => navigate('home')}
        user={user} onSelectBrowse={() => navigate('home')} onSelectProfile={() => navigate('account')} onSelectLogout={signOut}
/>
      <Sidebar mode={sidebarMode} screen={screen} discLang={discLang} setDiscLang={setDiscLang} activePill={activePill} setActivePill={setPill} t={t} seriesList={seriesList} contentType={contentType}
        user={user} onSignOut={signOut}
        onOpenAccount={() => navigate('account')} onOpenSaved={() => navigate('saved')} onOpenHistory={() => navigate('history')}/>
      <div className="main">
        <div className={homeClass}>
          <HomeScreen seriesList={seriesList} dataLoading={listLoading} onSeries={openSeries}
            onPlayFirst={playFirst}
            activePill={activePill} setActivePill={setPill} discLang={discLang} setDiscLang={setDiscLang} contentType={contentType} search={search} nowPlaying={clDismissed ? null : nowPlaying} audioPct={audioPct} onResume={onResume} onDismissCL={() => setCLD(true)} savedSeries={savedSeries} onToggleSave={toggleSaveSeries} setSearch={setSearch} searchOpen={mobSearchOpen} setSearchOpen={setMobSearchOpen} t={t} isDesktop={isDesktop}/>
        </div>
        <div className={serClass}>
          {selSeries && <SeriesScreen series={selSeries} onBack={() => navigate('home')} onEpisode={ep => { playEp(selSeries, ep); setPO(true); }} onOpenPlayer={() => setPO(true)} onTogglePlay={onTogglePlay}
            currentEp={nowPlaying?.series?.i === selSeries?.i ? nowPlaying?.episode : null} isPlaying={isPlaying} audioPct={audioPct}
            saved={savedSeries.has(selSeries.i)} onToggleSave={toggleSaveSeries} onShare={shareApp}
            savedEpisodeUrls={savedEpisodeUrls} onToggleSaveEpisode={toggleSaveEpisode} progress={progress} t={t}/>}
        </div>
        <div className={savedClass}>
          <SavedScreen discourseSeries={allDiscourseSeries} videoSeries={allVideoSeries} books={OSHO_BOOKS} savedSeries={savedSeries} onToggleSave={toggleSaveSeries}
            savedEpisodes={savedEpisodes} onToggleSaveEpisode={toggleSaveEpisode} onPlayEpisode={playEntry}
            history={history} onRemoveHistory={removeHistoryEntry} onClearHistory={clearHistory}
            savedBooks={savedBooks} onToggleSaveBook={toggleSaveBook} onReadBook={onReadBook}
            onSeries={openSeries} t={t}/>
        </div>
        <div className={histClass}>
          <HistoryScreen onBack={() => navigate('home')} history={history} onPlayEntry={playEntry} onRemove={removeHistoryEntry} onClearAll={clearHistory} t={t}/>
        </div>
        <div className={acctClass}>
          {(screen === 'account' || visitedAccount.current) && (visitedAccount.current = true) && (
            <Suspense fallback={null}>
              <AccountScreen onOpenSaved={() => navigate('saved')} onOpenHistory={() => navigate('history')} lang={lang} setLang={setLang}
                theme={theme} setTheme={setTheme} textSize={textSize} setTextSize={setTextSize} onSignIn={() => setShowAuth(true)} t={t}
                savedSeriesCount={savedSeries.size} savedEpisodesCount={savedEpisodes.length} historyCount={history.length}
                onAccountDeleted={() => { navigate('home'); showToast('Account deleted'); }}/>
            </Suspense>
          )}
        </div>
      </div>
      <MiniPlayer nowPlaying={nowPlaying} isPlaying={isPlaying} onTogglePlay={onTogglePlay} onPrev={onPrev} onNext={onNext} onSeekSeconds={onSeekSeconds} onOpen={() => setPO(true)}
        onClose={closeMini} onOpenSeries={() => { if (nowPlaying) navigate('series', nowPlaying.series); }}
        liked={nowPlaying ? savedEpisodeUrls.has(nowPlaying.episode.u) : false}
        onToggleLike={() => { if (nowPlaying) toggleSaveEpisode(nowPlaying.series, nowPlaying.episode); }}
        audioRef={audioRef} videoRef={videoRef} isDesktop={isDesktop} mediaError={mediaError} onRetry={retryPlay}/>
      <MobileNav screen={screen} contentType={contentType} onSelectContentType={selectContentType} t={t}
        onOpenSaved={() => navigate('saved')} onOpenHistory={() => navigate('history')}
        onAccount={() => navigate('account')}/>
      <FullPlayer open={playerOpen} onClose={() => setPO(false)} nowPlaying={nowPlaying} isPlaying={isPlaying} onTogglePlay={onTogglePlay} audioRef={audioRef} videoRef={videoRef} onPrev={onPrev} onNext={onNext} onSeekSeconds={onSeekSeconds} t={t} isDesktop={isDesktop}
        playbackSpeed={playbackSpeed} setPlaybackSpeed={setPlaybackSpeed}
        sleepOption={sleepOption} setSleepOption={setSleepOption} sleepRemaining={sleepRemaining}
        mediaError={mediaError} onRetry={retryPlay}
        episodeIndex={episodeIndex} totalEpisodes={nowPlaying?.series?.e?.length || 0}
        onOpenSeries={() => { if (nowPlaying) { navigate('series', nowPlaying.series); setPO(false); } }}
        onPlayEpisode={ep => { if (nowPlaying) playEp(nowPlaying.series, ep); }}
        onShare={shareApp}
        liked={nowPlaying ? savedEpisodeUrls.has(nowPlaying.episode.u) : false}
        onToggleLike={() => { if (nowPlaying) toggleSaveEpisode(nowPlaying.series, nowPlaying.episode); }}/>
      <div className={`toast${toast?' show':''}`}>{toast}</div>
      {booting && <LoadScreen progress={bootProgress} onDone={finishBoot}/>}
      {showAuth && <Suspense fallback={null}><AuthScreen onClose={() => setShowAuth(false)}/></Suspense>}
    </div>
  );
}

export default App;
