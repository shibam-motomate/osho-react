import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { T, isVideoId } from './config.js';
import { FullPlayer } from './components/FullPlayer.jsx';
import { Header } from './components/Header.jsx';
import { HistoryScreen } from './components/HistoryScreen.jsx';
import { HomeScreen } from './components/HomeScreen.jsx';
import { MiniPlayer } from './components/MiniPlayer.jsx';
import { MobileNav } from './components/MobileNav.jsx';
import { SavedScreen } from './components/SavedScreen.jsx';
import { SeriesScreen } from './components/SeriesScreen.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { Splash } from './components/Splash.jsx';
import { useAuth } from './contexts/AuthContext.jsx';
import { OSHO_BOOKS } from './data/oshoBooks.js';
import { OSHO_VIDEOS_EN, OSHO_VIDEOS_HI } from './data/oshoVideos.js';
import { installFocusAutoScroll, isTvDevice } from './lib/a11y.js';
import { supabase, supabaseEnabled } from './lib/supabaseClient.js';

const AccountScreen = lazy(() => import('./components/AccountScreen.jsx').then(m => ({default: m.AccountScreen})));
const AuthScreen = lazy(() => import('./components/AuthScreen.jsx').then(m => ({default: m.AuthScreen})));

const HISTORY_LIMIT = 60;

const PROFILE_SCREENS = ['saved', 'history', 'account'];

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
  const [nowPlaying,  setNP]        = useState(null);
  const [isPlaying,   setPlay]      = useState(false);
  const [playerOpen,  setPO]        = useState(false);
  const [clDismissed, setCLD]       = useState(false);
  const [audioPct,    setAudioPct]  = useState(0);
  const [isDesktop,   setIsDesktop] = useState(() => window.innerWidth >= 900);
  const [toast,       setToast]     = useState(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [sleepOption, setSleepOptionState] = useState('off'); // 'off' | 15 | 30 | 60 | 'end'
  const [sleepEndAt,  setSleepEndAt] = useState(null);
  const [sleepRemaining, setSleepRemaining] = useState(0);
  const [showSplash, setShowSplash] = useState(() => {
    try { return !localStorage.getItem('osho_seen_intro'); } catch(e) { return false; }
  });
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
  const [dataLoading, setDataLoading] = useState(true);
  const [seriesVersion, setSeriesVersion] = useState(0);
  const audioRef = useRef(null);
  const videoRef = useRef(null);
  const toastTimer = useRef(null);
  const sleepOptionRef = useRef('off');
  const seriesCacheRef = useRef({});

  // Video episodes play through the <video> element (rendered visibly inside FullPlayer),
  // audio discourses through the hidden <audio> element — both stay permanently mounted
  // from the very first render (FullPlayer never unmounts its <video>) so a ref is always
  // valid the instant playback starts, even before FullPlayer has ever been opened.
  const mediaRefFor = useCallback(seriesId => (isVideoId(seriesId) ? videoRef : audioRef), []);

  const sidebarMode = PROFILE_SCREENS.includes(screen) ? 'profile' : 'browse';
  // Which tab screen Series was pushed from, so only that one dims/parallax-shifts
  // behind it (iOS push-navigation feel) — the other tabs stay put, untouched.
  const [pushedFrom, setPushedFrom] = useState('home');

  // Real URL navigation — pushes browser history so back/forward and
  // shareable links work, instead of just swapping in-memory screen state.
  const navigate = useCallback((nextScreen, series = null) => {
    if (nextScreen === 'series' && screen !== 'series') setPushedFrom(screen);
    setScreen(nextScreen);
    if (nextScreen === 'series' && series) setSelSeries(series);
    else if (nextScreen === 'home') setSelSeries(null);
    const path = nextScreen === 'series' ? `/series/${encodeURIComponent(series.i)}`
      : nextScreen === 'home' ? '/' : `/${nextScreen}`;
    if (window.location.pathname !== path) window.history.pushState({}, '', path);
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
    if (window.location.pathname !== path) window.history.pushState({}, '', path);
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
      let list = seriesCacheRef.current[l];
      if (!list) {
        const mod = await (l === 'hi' ? import('./data/oshoData.hi.js') : import('./data/oshoData.en.js'));
        list = l === 'hi' ? mod.OSHO_DATA_HI : mod.OSHO_DATA_EN;
        seriesCacheRef.current[l] = list;
      }
      const found = list.find(s => s.i === id);
      if (found) return {series: found, lang: l, pool: 'discourses'};
    }
    return null;
  }, []);

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
    const onPop = () => applyPath(window.location.pathname);
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
      audio.addEventListener('loadedmetadata', () => { audio.currentTime = time; }, { once: true });
    }
  }, []);

  const t = T[lang];

  // Lazy-load each discourse language's dataset only when first needed, then cache it
  useEffect(() => {
    if (seriesCacheRef.current[discLang]) { setDataLoading(false); return; }
    setDataLoading(true);
    const loader = discLang === 'hi' ? import('./data/oshoData.hi.js') : import('./data/oshoData.en.js');
    loader.then(mod => {
      seriesCacheRef.current[discLang] = discLang === 'hi' ? mod.OSHO_DATA_HI : mod.OSHO_DATA_EN;
      setSeriesVersion(v => v + 1);
      setDataLoading(false);
    });
  }, [discLang]);

  const discourseList = useMemo(() => seriesCacheRef.current[discLang] || [], [discLang, seriesVersion]);
  const videoList = useMemo(() => (discLang === 'hi' ? OSHO_VIDEOS_HI : OSHO_VIDEOS_EN), [discLang]);
  // Tagged with the language each series belongs to, so the Saved screen (which combines
  // both languages into one list) can label each card correctly regardless of the current
  // discLang toggle.
  const allDiscourseSeries = useMemo(() => [
    ...(seriesCacheRef.current.en || []).map(s => ({...s, _lang: 'en'})),
    ...(seriesCacheRef.current.hi || []).map(s => ({...s, _lang: 'hi'})),
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
    const t = setTimeout(() => el.remove(), 650);
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

  // Playback speed
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackSpeed;
    if (videoRef.current) videoRef.current.playbackRate = playbackSpeed;
  }, [playbackSpeed]);

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

  // Persist position every 5s — whichever of audio/video is actually playing
  useEffect(() => {
    const iv = setInterval(() => {
      const el = audioRef.current && !audioRef.current.paused ? audioRef.current
        : videoRef.current && !videoRef.current.paused ? videoRef.current : null;
      if (el) localStorage.setItem('osho_time', String(el.currentTime));
    }, 5000);
    return () => clearInterval(iv);
  }, []);

  // Mini player / continue-listening progress — both elements stay mounted, so listen on
  // both; only the one actually playing will ever fire timeupdate.
  useEffect(() => {
    const onTime = e => { if (e.target.duration > 0) setAudioPct((e.target.currentTime / e.target.duration) * 100); };
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
    const onPlay  = () => setPlay(true);
    const onPause = () => setPlay(false);
    const onEnded = () => {
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
    });
    return () => els.forEach(el => {
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('ended', onEnded);
    });
  }, [onNext]);

  const playEp = useCallback((series, episode) => {
    const np = {series, episode};
    setNP(np);
    setCLD(false);
    localStorage.setItem('osho_np', JSON.stringify(np));
    localStorage.setItem('osho_time', '0');
    const media = mediaRefFor(series.i).current;
    const other = media === videoRef.current ? audioRef.current : videoRef.current;
    if (other) other.pause();
    if (media) {
      media.src = episode.u;
      media.currentTime = 0;
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
  }, [discLang, user, mediaRefFor]);

  // Shared resolver for anything stored as {seriesId, episodeUrl, discLang} —
  // history entries and saved episodes both use this shape.
  const playEntry = useCallback(async entry => {
    const pool = isVideoId(entry.seriesId) ? 'videos' : 'discourses';
    let list;
    if (pool === 'videos') {
      list = entry.discLang === 'hi' ? OSHO_VIDEOS_HI : OSHO_VIDEOS_EN;
    } else {
      list = seriesCacheRef.current[entry.discLang];
      if (!list) {
        const mod = await (entry.discLang === 'hi' ? import('./data/oshoData.hi.js') : import('./data/oshoData.en.js'));
        list = entry.discLang === 'hi' ? mod.OSHO_DATA_HI : mod.OSHO_DATA_EN;
        seriesCacheRef.current[entry.discLang] = list;
        setSeriesVersion(v => v + 1);
      }
    }
    const series = list.find(s => s.i === entry.seriesId);
    const episode = series?.e.find(e => e.u === entry.episodeUrl);
    if (!series || !episode) return;
    setDiscLang(entry.discLang);
    setContentType(pool);
    playEp(series, episode);
    setPO(true);
    navigate('home');
  }, [playEp, navigate]);

  const onTogglePlay = useCallback(() => {
    if (!nowPlaying) return;
    const media = mediaRefFor(nowPlaying.series.i).current;
    if (!media) return;
    isPlaying ? media.pause() : media.play().catch(() => {});
  }, [isPlaying, nowPlaying, mediaRefFor]);

  const onPrev = useCallback(() => {
    if (!nowPlaying) return;
    const eps = nowPlaying.series.e;
    const idx = eps.findIndex(e => e.u === nowPlaying.episode.u);
    if (idx > 0) playEp(nowPlaying.series, eps[idx - 1]);
  }, [nowPlaying, playEp]);

  const onSeekSeconds = useCallback(delta => {
    if (!nowPlaying) return;
    const media = mediaRefFor(nowPlaying.series.i).current;
    if (media) media.currentTime = Math.max(0, media.currentTime + delta);
  }, [nowPlaying, mediaRefFor]);

  const setSleepOption = useCallback(opt => {
    setSleepOptionState(opt);
    setSleepEndAt(opt === 'off' || opt === 'end' ? null : Date.now() + opt * 60000);
  }, []);

  // Keyboard shortcuts: Space play/pause, Left/Right seek 30s. On TV browsers these
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
      else if (e.code === 'ArrowRight') { e.preventDefault(); onSeekSeconds(30); }
      else if (e.code === 'ArrowLeft') { e.preventDefault(); onSeekSeconds(-30); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [nowPlaying, onTogglePlay, onSeekSeconds, playerOpen]);

  const episodeIndex = nowPlaying ? nowPlaying.series.e.findIndex(e => e.u === nowPlaying.episode.u) : -1;
  const nextEpisode = nowPlaying && episodeIndex >= 0 && episodeIndex < nowPlaying.series.e.length - 1
    ? nowPlaying.series.e[episodeIndex + 1] : null;

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

  const dismissSplash = useCallback(() => {
    try { localStorage.setItem('osho_seen_intro', '1'); } catch(e) {}
    setShowSplash(false);
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

  // Kick back to Home if signed out while on the account page (Saved/History stay guest-usable).
  // Waits for authLoading to settle first so a logged-in session restoring from storage
  // isn't mistaken for a logged-out user on direct/deep-link loads.
  useEffect(() => {
    if (!authLoading && screen === 'account' && !user) navigate('home');
  }, [authLoading, screen, user, navigate]);

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
    <div id="app" className={playerOpen ? 'player-open' : ''} style={{fontFamily:appFont,height:'100vh'}}>
      <audio ref={audioRef} preload="none" style={{display:'none'}}/>
      <Header t={t} contentType={contentType} onSelectContentType={selectContentType} search={search} setSearch={setSearch} discLang={discLang} setDiscLang={setDiscLang}
        onShareApp={shareApp} onOpenSaved={() => navigate('saved')} onLogoClick={() => navigate('home')}
        user={user} onSelectBrowse={() => navigate('home')} onSelectProfile={() => user ? navigate('account') : setShowAuth(true)} onSelectLogout={signOut}
        mobSearchOpen={mobSearchOpen} onToggleMobSearch={() => setMobSearchOpen(v => !v)}/>
      <Sidebar mode={sidebarMode} screen={screen} discLang={discLang} setDiscLang={setDiscLang} activePill={activePill} setActivePill={setPill} t={t} seriesList={seriesList} contentType={contentType}
        user={user} onSignOut={signOut}
        onOpenAccount={() => navigate('account')} onOpenSaved={() => navigate('saved')} onOpenHistory={() => navigate('history')}/>
      <div className="main">
        <div className={homeClass}>
          <HomeScreen seriesList={seriesList} dataLoading={listLoading} onSeries={s => navigate('series', s)}
            onPlayFirst={s => { if (s.e && s.e.length) { playEp(s, s.e[0]); setPO(true); } }}
            activePill={activePill} setActivePill={setPill} discLang={discLang} contentType={contentType} search={search} nowPlaying={clDismissed ? null : nowPlaying} audioPct={audioPct} onResume={onResume} onDismissCL={() => setCLD(true)} savedSeries={savedSeries} onToggleSave={toggleSaveSeries} savedBooks={savedBooks} onToggleSaveBook={toggleSaveBook} onReadBook={onReadBook} t={t} isDesktop={isDesktop}/>
        </div>
        <div className={serClass}>
          {selSeries && <SeriesScreen series={selSeries} onBack={() => navigate('home')} onEpisode={ep => { playEp(selSeries, ep); setPO(true); }} currentEp={nowPlaying?.series?.i === selSeries?.i ? nowPlaying?.episode : null} savedEpisodeUrls={savedEpisodeUrls} onToggleSaveEpisode={toggleSaveEpisode} t={t}/>}
        </div>
        <div className={savedClass}>
          <SavedScreen onBack={() => navigate('home')} discourseSeries={allDiscourseSeries} videoSeries={allVideoSeries} books={OSHO_BOOKS} savedSeries={savedSeries} onToggleSave={toggleSaveSeries}
            savedEpisodes={savedEpisodes} onToggleSaveEpisode={toggleSaveEpisode} onPlayEpisode={playEntry}
            savedBooks={savedBooks} onToggleSaveBook={toggleSaveBook} onReadBook={onReadBook}
            onSeries={s => navigate('series', s)} t={t}/>
        </div>
        <div className={histClass}>
          <HistoryScreen onBack={() => navigate('home')} history={history} onPlayEntry={playEntry} onRemove={removeHistoryEntry} onClearAll={clearHistory}/>
        </div>
        <div className={acctClass}>
          {(screen === 'account' || visitedAccount.current) && (visitedAccount.current = true) && (
            <Suspense fallback={null}>
              <AccountScreen onBack={() => navigate('home')} onOpenSaved={() => navigate('saved')} onOpenHistory={() => navigate('history')} lang={lang} setLang={setLang}
                savedSeriesCount={savedSeries.size} savedEpisodesCount={savedEpisodes.length} historyCount={history.length}
                onAccountDeleted={() => { navigate('home'); showToast('Account deleted'); }}/>
            </Suspense>
          )}
        </div>
      </div>
      <MiniPlayer nowPlaying={nowPlaying} isPlaying={isPlaying} onTogglePlay={onTogglePlay} onPrev={onPrev} onNext={onNext} onOpen={() => setPO(true)}
        onClose={closeMini} onOpenSeries={() => { if (nowPlaying) navigate('series', nowPlaying.series); }}
        liked={nowPlaying ? savedEpisodeUrls.has(nowPlaying.episode.u) : false}
        onToggleLike={() => { if (nowPlaying) toggleSaveEpisode(nowPlaying.series, nowPlaying.episode); }}
        audioRef={audioRef} videoRef={videoRef} isDesktop={isDesktop}/>
      <MobileNav screen={screen} contentType={contentType} onSelectContentType={selectContentType} t={t}
        onOpenSaved={() => navigate('saved')} onOpenHistory={() => navigate('history')}
        onAccount={() => user ? navigate('account') : setShowAuth(true)}/>
      <FullPlayer open={playerOpen} onClose={() => setPO(false)} nowPlaying={nowPlaying} isPlaying={isPlaying} onTogglePlay={onTogglePlay} audioRef={audioRef} videoRef={videoRef} onPrev={onPrev} onNext={onNext} onSeekSeconds={onSeekSeconds} t={t} isDesktop={isDesktop}
        playbackSpeed={playbackSpeed} setPlaybackSpeed={setPlaybackSpeed}
        sleepOption={sleepOption} setSleepOption={setSleepOption} sleepRemaining={sleepRemaining}
        episodeIndex={episodeIndex} totalEpisodes={nowPlaying?.series?.e?.length || 0}
        onOpenSeries={() => { if (nowPlaying) { navigate('series', nowPlaying.series); setPO(false); } }}
        onPlayEpisode={ep => { if (nowPlaying) playEp(nowPlaying.series, ep); }}
        onShare={shareApp}/>
      <div className={`toast${toast?' show':''}`}>{toast}</div>
      {showSplash && <Splash onDone={dismissSplash}/>}
      {showAuth && <Suspense fallback={null}><AuthScreen onClose={() => setShowAuth(false)}/></Suspense>}
    </div>
  );
}

export default App;
