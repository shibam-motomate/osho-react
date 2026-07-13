import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { T } from './config.js';
import { AccountScreen } from './components/AccountScreen.jsx';
import { AuthScreen } from './components/AuthScreen.jsx';
import { FullPlayer } from './components/FullPlayer.jsx';
import { HistoryScreen } from './components/HistoryScreen.jsx';
import { HomeScreen } from './components/HomeScreen.jsx';
import { MiniPlayer } from './components/MiniPlayer.jsx';
import { MobileNav } from './components/MobileNav.jsx';
import { SavedScreen } from './components/SavedScreen.jsx';
import { SeriesScreen } from './components/SeriesScreen.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { Splash } from './components/Splash.jsx';
import { useAuth } from './contexts/AuthContext.jsx';
import { supabase, supabaseEnabled } from './lib/supabaseClient.js';

const HISTORY_LIMIT = 60;

const PROFILE_SCREENS = ['saved', 'history', 'account'];

function App() {
  const {user, authLoading, signOut} = useAuth();
  const [showAuth, setShowAuth] = useState(false);
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
  const [savedSeries, setSavedSeries] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('osho_saved_series') || '[]')); } catch(e) { return new Set(); }
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
  const toastTimer = useRef(null);
  const sleepOptionRef = useRef('off');
  const seriesCacheRef = useRef({});

  const sidebarMode = PROFILE_SCREENS.includes(screen) ? 'profile' : 'browse';

  // Real URL navigation — pushes browser history so back/forward and
  // shareable links work, instead of just swapping in-memory screen state.
  const navigate = useCallback((nextScreen, series = null) => {
    setScreen(nextScreen);
    if (nextScreen === 'series' && series) setSelSeries(series);
    else if (nextScreen === 'home') setSelSeries(null);
    const path = nextScreen === 'series' ? `/series/${encodeURIComponent(series.i)}`
      : nextScreen === 'home' ? '/' : `/${nextScreen}`;
    if (window.location.pathname !== path) window.history.pushState({}, '', path);
  }, []);

  const resolveSeriesById = useCallback(async id => {
    for (const l of ['en', 'hi']) {
      let list = seriesCacheRef.current[l];
      if (!list) {
        const mod = await (l === 'hi' ? import('./data/oshoData.hi.js') : import('./data/oshoData.en.js'));
        list = l === 'hi' ? mod.OSHO_DATA_HI : mod.OSHO_DATA_EN;
        seriesCacheRef.current[l] = list;
      }
      const found = list.find(s => s.i === id);
      if (found) return {series: found, lang: l};
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
          setSelSeries(found.series);
          setScreen('series');
          setSeriesVersion(v => v + 1);
        } else {
          setScreen('home');
        }
      } else if (path === '/saved' || path === '/history' || path === '/account') {
        setScreen(path.slice(1));
      } else {
        setScreen('home');
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

  const seriesList = useMemo(() => seriesCacheRef.current[discLang] || [], [discLang, seriesVersion]);

  // Hide splash loader once app has mounted
  useEffect(() => {
    const el = document.getElementById('loader');
    if (!el) return;
    el.classList.add('fade');
    const t = setTimeout(() => el.remove(), 650);
    return () => clearTimeout(t);
  }, []);

  // Reset genre filter when discourse language changes
  useEffect(() => { setPill('all'); }, [discLang]);

  useEffect(() => { sleepOptionRef.current = sleepOption; }, [sleepOption]);

  // Playback speed
  useEffect(() => { if (audioRef.current) audioRef.current.playbackRate = playbackSpeed; }, [playbackSpeed]);

  // Sleep timer countdown
  useEffect(() => {
    if (!sleepEndAt) { setSleepRemaining(0); return; }
    const iv = setInterval(() => {
      const remaining = Math.max(0, Math.round((sleepEndAt - Date.now()) / 1000));
      setSleepRemaining(remaining);
      if (remaining <= 0) {
        if (audioRef.current) audioRef.current.pause();
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
        if (audioRef.current) {
          audioRef.current.src = np.episode.u;
          const t = parseFloat(localStorage.getItem('osho_time') || '0');
          seekWhenReady(audioRef.current, t);
        }
      }
    } catch(e) {}
  }, [seekWhenReady]);

  // Persist position every 5s
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const iv = setInterval(() => {
      if (!audio.paused) localStorage.setItem('osho_time', String(audio.currentTime));
    }, 5000);
    return () => clearInterval(iv);
  }, []);

  // Mini player progress
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => { if (audio.duration > 0) setAudioPct((audio.currentTime / audio.duration) * 100); };
    audio.addEventListener('timeupdate', onTime);
    return () => audio.removeEventListener('timeupdate', onTime);
  }, []);

  // Sync play/pause state + auto-next
  const onNext = useCallback(() => {
    if (!nowPlaying) return;
    const eps = nowPlaying.series.e;
    const idx = eps.findIndex(e => e.u === nowPlaying.episode.u);
    if (idx < eps.length - 1) playEp(nowPlaying.series, eps[idx + 1]);
  }, [nowPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
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
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, [onNext]);

  const playEp = useCallback((series, episode) => {
    const np = {series, episode};
    setNP(np);
    setCLD(false);
    localStorage.setItem('osho_np', JSON.stringify(np));
    localStorage.setItem('osho_time', '0');
    if (audioRef.current) {
      audioRef.current.src = episode.u;
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
    setHistory(prev => {
      const entry = {seriesId: series.i, seriesName: series.n, episodeUrl: episode.u, episodeTitle: episode.t, discLang, playedAt: Date.now()};
      const next = [entry, ...prev.filter(h => h.episodeUrl !== episode.u)].slice(0, HISTORY_LIMIT);
      try { localStorage.setItem('osho_history', JSON.stringify(next)); } catch(e) {}
      return next;
    });
  }, [discLang]);

  // Shared resolver for anything stored as {seriesId, episodeUrl, discLang} —
  // history entries and saved episodes both use this shape.
  const playEntry = useCallback(async entry => {
    let list = seriesCacheRef.current[entry.discLang];
    if (!list) {
      const mod = await (entry.discLang === 'hi' ? import('./data/oshoData.hi.js') : import('./data/oshoData.en.js'));
      list = entry.discLang === 'hi' ? mod.OSHO_DATA_HI : mod.OSHO_DATA_EN;
      seriesCacheRef.current[entry.discLang] = list;
      setSeriesVersion(v => v + 1);
    }
    const series = list.find(s => s.i === entry.seriesId);
    const episode = series?.e.find(e => e.u === entry.episodeUrl);
    if (!series || !episode) return;
    setDiscLang(entry.discLang);
    playEp(series, episode);
    setPO(true);
    navigate('home');
  }, [playEp, navigate]);

  const onTogglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !nowPlaying) return;
    isPlaying ? audio.pause() : audio.play().catch(() => {});
  }, [isPlaying, nowPlaying]);

  const onPrev = useCallback(() => {
    if (!nowPlaying) return;
    const eps = nowPlaying.series.e;
    const idx = eps.findIndex(e => e.u === nowPlaying.episode.u);
    if (idx > 0) playEp(nowPlaying.series, eps[idx - 1]);
  }, [nowPlaying, playEp]);

  const onSeekSeconds = useCallback(delta => {
    if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime + delta);
  }, []);

  const setSleepOption = useCallback(opt => {
    setSleepOptionState(opt);
    setSleepEndAt(opt === 'off' || opt === 'end' ? null : Date.now() + opt * 60000);
  }, []);

  // Keyboard shortcuts: Space play/pause, Left/Right seek 30s
  useEffect(() => {
    const handler = e => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || !nowPlaying) return;
      if (e.code === 'Space') { e.preventDefault(); onTogglePlay(); }
      else if (e.code === 'ArrowRight') { e.preventDefault(); onSeekSeconds(30); }
      else if (e.code === 'ArrowLeft') { e.preventDefault(); onSeekSeconds(-30); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [nowPlaying, onTogglePlay, onSeekSeconds]);

  const episodeIndex = nowPlaying ? nowPlaying.series.e.findIndex(e => e.u === nowPlaying.episode.u) : -1;
  const nextEpisode = nowPlaying && episodeIndex >= 0 && episodeIndex < nowPlaying.series.e.length - 1
    ? nowPlaying.series.e[episodeIndex + 1] : null;

  const onResume = () => {
    const saved = parseFloat(localStorage.getItem('osho_time') || '0');
    seekWhenReady(audioRef.current, saved);
    setPO(true);
    if (audioRef.current) audioRef.current.play().catch(() => {});
  };

  const showToast = useCallback(msg => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

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
          supabase.from('saved_series').upsert({user_id: user.id, series_id: id}, {onConflict: 'user_id,series_id'});
        } else {
          supabase.from('saved_series').delete().eq('user_id', user.id).eq('series_id', id);
        }
      }
      return next;
    });
  }, [user]);

  // On login, merge the account's saved series with whatever is saved locally
  // (guest usage before signing in), then push any local-only saves up.
  useEffect(() => {
    if (!supabaseEnabled || !user) return;
    let cancelled = false;
    (async () => {
      const {data, error} = await supabase.from('saved_series').select('series_id').eq('user_id', user.id);
      if (cancelled || error) return;
      const remoteIds = new Set((data || []).map(r => r.series_id));
      setSavedSeries(prev => {
        const toPush = Array.from(prev).filter(id => !remoteIds.has(id));
        if (toPush.length) {
          supabase.from('saved_series')
            .upsert(toPush.map(series_id => ({user_id: user.id, series_id})), {onConflict: 'user_id,series_id'});
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
          }, {onConflict: 'user_id,episode_url'});
        } else {
          supabase.from('saved_episodes').delete().eq('user_id', user.id).eq('episode_url', episode.u);
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
      if (cancelled || error) return;
      const remote = (data || []).map(r => ({seriesId: r.series_id, seriesName: r.series_name, episodeUrl: r.episode_url, episodeTitle: r.episode_title, duration: r.duration, discLang: r.disc_lang}));
      const remoteUrls = new Set(remote.map(r => r.episodeUrl));
      setSavedEpisodes(prev => {
        const toPush = prev.filter(e => !remoteUrls.has(e.episodeUrl));
        if (toPush.length) {
          supabase.from('saved_episodes').upsert(toPush.map(e => ({
            user_id: user.id, series_id: e.seriesId, series_name: e.seriesName,
            episode_url: e.episodeUrl, episode_title: e.episodeTitle, duration: e.duration, disc_lang: e.discLang,
          })), {onConflict: 'user_id,episode_url'});
        }
        const merged = [...toPush, ...remote];
        try { localStorage.setItem('osho_saved_episodes', JSON.stringify(merged)); } catch(e) {}
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
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try { localStorage.setItem('osho_history', '[]'); } catch(e) {}
  }, []);

  const savedEpisodeUrls = useMemo(() => new Set(savedEpisodes.map(e => e.episodeUrl)), [savedEpisodes]);

  const appFont = lang === 'hi' ? 'var(--font-hi)' : lang === 'bn' ? 'var(--font-bn)' : 'var(--font)';
  const homeClass  = `screen${!isDesktop ? (screen !== 'home'    ? ' behind' : '') : ''} ${isDesktop && screen === 'home'    ? 'desk-show' : ''}`;
  const serClass   = `screen${!isDesktop ? (screen !== 'series'  ? ' hidden' : '') : ''} ${isDesktop && screen === 'series'  ? 'desk-show' : ''}`;
  const savedClass = `screen${!isDesktop ? (screen !== 'saved'   ? ' hidden' : '') : ''} ${isDesktop && screen === 'saved'   ? 'desk-show' : ''}`;
  const histClass  = `screen${!isDesktop ? (screen !== 'history' ? ' hidden' : '') : ''} ${isDesktop && screen === 'history' ? 'desk-show' : ''}`;
  const acctClass  = `screen${!isDesktop ? (screen !== 'account' ? ' hidden' : '') : ''} ${isDesktop && screen === 'account' ? 'desk-show' : ''}`;

  return (
    <div id="app" className={playerOpen ? 'player-open' : ''} style={{fontFamily:appFont,height:'100vh'}}>
      <audio ref={audioRef} preload="none" style={{display:'none'}}/>
      <Sidebar mode={sidebarMode} screen={screen} onLogoClick={() => navigate('home')} discLang={discLang} setDiscLang={setDiscLang} activePill={activePill} setActivePill={setPill} t={t} seriesList={seriesList}
        user={user} onSignOut={signOut}
        onOpenAccount={() => navigate('account')} onOpenSaved={() => navigate('saved')} onOpenHistory={() => navigate('history')}/>
      <div className="main">
        <div className={homeClass}>
          <HomeScreen seriesList={seriesList} dataLoading={dataLoading} onSeries={s => navigate('series', s)} activePill={activePill} setActivePill={setPill} discLang={discLang} setDiscLang={setDiscLang} nowPlaying={clDismissed ? null : nowPlaying} audioPct={audioPct} onResume={onResume} onDismissCL={() => setCLD(true)} onShareApp={shareApp} savedSeries={savedSeries} onToggleSave={toggleSaveSeries} t={t} isDesktop={isDesktop} user={user}
            onSelectBrowse={() => navigate('home')}
            onSelectProfile={() => user ? navigate('account') : setShowAuth(true)}
            onSelectLogout={signOut}/>
        </div>
        <div className={serClass}>
          {selSeries && <SeriesScreen series={selSeries} onBack={() => navigate('home')} onEpisode={ep => { playEp(selSeries, ep); setPO(true); }} currentEp={nowPlaying?.series?.i === selSeries?.i ? nowPlaying?.episode : null} savedEpisodeUrls={savedEpisodeUrls} onToggleSaveEpisode={toggleSaveEpisode} t={t}/>}
        </div>
        <div className={savedClass}>
          <SavedScreen onBack={() => navigate('home')} seriesList={seriesList} savedSeries={savedSeries} onToggleSave={toggleSaveSeries}
            savedEpisodes={savedEpisodes} onToggleSaveEpisode={toggleSaveEpisode} onPlayEpisode={playEntry}
            onSeries={s => navigate('series', s)} discLang={discLang} t={t}/>
        </div>
        <div className={histClass}>
          <HistoryScreen onBack={() => navigate('home')} history={history} onPlayEntry={playEntry} onRemove={removeHistoryEntry} onClearAll={clearHistory}/>
        </div>
        <div className={acctClass}>
          <AccountScreen onBack={() => navigate('home')} lang={lang} setLang={setLang} onAccountDeleted={() => { navigate('home'); showToast('Account deleted'); }}/>
        </div>
      </div>
      <MiniPlayer nowPlaying={nowPlaying} isPlaying={isPlaying} onTogglePlay={onTogglePlay} onPrev={onPrev} onNext={onNext} onOpen={() => setPO(true)} audioRef={audioRef}/>
      <MobileNav active={screen === 'series' ? 'home' : screen}
        onBrowse={() => navigate('home')}
        onSaved={() => navigate('saved')}
        onHistory={() => navigate('history')}
        onAccount={() => user ? navigate('account') : setShowAuth(true)}/>
      <FullPlayer open={playerOpen} onClose={() => setPO(false)} nowPlaying={nowPlaying} isPlaying={isPlaying} onTogglePlay={onTogglePlay} audioRef={audioRef} onPrev={onPrev} onNext={onNext} onSeekSeconds={onSeekSeconds} t={t} isDesktop={isDesktop}
        playbackSpeed={playbackSpeed} setPlaybackSpeed={setPlaybackSpeed}
        sleepOption={sleepOption} setSleepOption={setSleepOption} sleepRemaining={sleepRemaining}
        episodeIndex={episodeIndex} totalEpisodes={nowPlaying?.series?.e?.length || 0} nextEpisode={nextEpisode}/>
      <div className={`toast${toast?' show':''}`}>{toast}</div>
      {showSplash && <Splash onDone={dismissSplash}/>}
      {showAuth && <AuthScreen onClose={() => setShowAuth(false)}/>}
    </div>
  );
}

export default App;
