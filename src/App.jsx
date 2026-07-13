import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { T } from './config.js';
import { AuthScreen } from './components/AuthScreen.jsx';
import { FullPlayer } from './components/FullPlayer.jsx';
import { HomeScreen } from './components/HomeScreen.jsx';
import { MiniPlayer } from './components/MiniPlayer.jsx';
import { SeriesScreen } from './components/SeriesScreen.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { Splash } from './components/Splash.jsx';
import { useAuth } from './contexts/AuthContext.jsx';
import { supabase, supabaseEnabled } from './lib/supabaseClient.js';

function App() {
  const {user, signOut} = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [sidebarMode, setSidebarMode] = useState('browse'); // 'browse' | 'profile'
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
  const [dataLoading, setDataLoading] = useState(true);
  const [seriesVersion, setSeriesVersion] = useState(0);
  const audioRef = useRef(null);
  const toastTimer = useRef(null);
  const sleepOptionRef = useRef('off');
  const seriesCacheRef = useRef({});

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
  }, []);

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

  // Revert the sidebar to Browse if signed out while showing the Profile panel
  useEffect(() => {
    if (sidebarMode === 'profile' && !user) setSidebarMode('browse');
  }, [sidebarMode, user]);

  const goHome = useCallback(() => {
    setScreen('home');
    setSelSeries(null);
    setSidebarMode('browse');
  }, []);

  const openSeriesFromSidebar = useCallback(s => {
    setSelSeries(s);
    setScreen('series');
    setSidebarMode('browse');
  }, []);

  const appFont = lang === 'hi' ? 'var(--font-hi)' : lang === 'bn' ? 'var(--font-bn)' : 'var(--font)';
  const homeClass  = `screen${!isDesktop ? (screen !== 'home'   ? ' behind' : '') : ''} ${isDesktop && screen === 'home'   ? 'desk-show' : ''}`;
  const serClass   = `screen${!isDesktop ? (screen !== 'series' ? ' hidden' : '') : ''} ${isDesktop && screen === 'series' ? 'desk-show' : ''}`;

  return (
    <div id="app" className={playerOpen ? 'player-open' : ''} style={{fontFamily:appFont,height:'100vh'}}>
      <audio ref={audioRef} preload="none" style={{display:'none'}}/>
      <Sidebar mode={sidebarMode} onLogoClick={goHome} discLang={discLang} setDiscLang={setDiscLang} activePill={activePill} setActivePill={setPill} t={t} seriesList={seriesList}
        user={user} lang={lang} setLang={setLang} onSignOut={signOut} savedSeries={savedSeries} onToggleSave={toggleSaveSeries} onOpenSeries={openSeriesFromSidebar}/>
      <div className="main">
        <div className={homeClass}>
          <HomeScreen seriesList={seriesList} dataLoading={dataLoading} onSeries={s => { setSelSeries(s); setScreen('series'); }} activePill={activePill} setActivePill={setPill} discLang={discLang} setDiscLang={setDiscLang} nowPlaying={clDismissed ? null : nowPlaying} audioPct={audioPct} onResume={onResume} onDismissCL={() => setCLD(true)} onShareApp={shareApp} savedSeries={savedSeries} onToggleSave={toggleSaveSeries} t={t} isDesktop={isDesktop}
            onSelectBrowse={() => setSidebarMode('browse')}
            onSelectProfile={() => user ? setSidebarMode('profile') : setShowAuth(true)}/>
        </div>
        <div className={serClass}>
          {selSeries && <SeriesScreen series={selSeries} onBack={() => setScreen('home')} onEpisode={ep => { playEp(selSeries, ep); setPO(true); }} currentEp={nowPlaying?.series?.i === selSeries?.i ? nowPlaying?.episode : null} t={t}/>}
        </div>
      </div>
      <MiniPlayer nowPlaying={nowPlaying} isPlaying={isPlaying} onTogglePlay={onTogglePlay} onPrev={onPrev} onNext={onNext} onOpen={() => setPO(true)} audioRef={audioRef}/>
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
