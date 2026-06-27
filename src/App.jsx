import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { OSHO_DATA } from './data/oshoData.js';
import { T } from './config.js';
import { FullPlayer } from './components/FullPlayer.jsx';
import { HomeScreen } from './components/HomeScreen.jsx';
import { MiniPlayer } from './components/MiniPlayer.jsx';
import { SeriesScreen } from './components/SeriesScreen.jsx';
import { Sidebar } from './components/Sidebar.jsx';

function App() {
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
  const audioRef = useRef(null);

  const t = T[lang];
  const seriesList = useMemo(() => OSHO_DATA[discLang] || OSHO_DATA.en, [discLang]);

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
          audioRef.current.currentTime = t;
        }
      }
    } catch(e) {}
  }, []);

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
    const onEnded = () => onNext();
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

  const onResume = () => {
    const saved = parseFloat(localStorage.getItem('osho_time') || '0');
    if (audioRef.current && saved > 0) audioRef.current.currentTime = saved;
    setPO(true);
    if (audioRef.current) audioRef.current.play().catch(() => {});
  };

  const appFont = lang === 'hi' ? 'var(--font-hi)' : lang === 'bn' ? 'var(--font-bn)' : 'var(--font)';
  const homeClass  = `screen${!isDesktop ? (screen !== 'home'   ? ' behind' : '') : ''} ${isDesktop && screen === 'home'   ? 'desk-show' : ''}`;
  const serClass   = `screen${!isDesktop ? (screen !== 'series' ? ' hidden' : '') : ''} ${isDesktop && screen === 'series' ? 'desk-show' : ''}`;

  return (
    <div id="app" style={{fontFamily:appFont,height:'100vh'}}>
      <audio ref={audioRef} preload="none" style={{display:'none'}}/>
      <Sidebar lang={lang} setLang={setLang} discLang={discLang} setDiscLang={setDiscLang} activePill={activePill} setActivePill={setPill} t={t} seriesList={seriesList}/>
      <div className="main">
        <div className={homeClass}>
          <HomeScreen seriesList={seriesList} onSeries={s => { setSelSeries(s); setScreen('series'); }} activePill={activePill} setActivePill={setPill} lang={lang} setLang={setLang} discLang={discLang} setDiscLang={setDiscLang} nowPlaying={clDismissed ? null : nowPlaying} audioPct={audioPct} onResume={onResume} onDismissCL={() => setCLD(true)} t={t} isDesktop={isDesktop}/>
        </div>
        <div className={serClass}>
          {selSeries && <SeriesScreen series={selSeries} onBack={() => setScreen('home')} onEpisode={ep => { playEp(selSeries, ep); setPO(true); }} currentEp={nowPlaying?.series?.i === selSeries?.i ? nowPlaying?.episode : null} t={t}/>}
        </div>
      </div>
      <MiniPlayer nowPlaying={nowPlaying} isPlaying={isPlaying} onTogglePlay={onTogglePlay} onOpen={() => setPO(true)} audioRef={audioRef}/>
      <FullPlayer open={playerOpen} onClose={() => setPO(false)} nowPlaying={nowPlaying} isPlaying={isPlaying} onTogglePlay={onTogglePlay} audioRef={audioRef} onPrev={onPrev} onNext={onNext} onSeekSeconds={onSeekSeconds} t={t}/>
    </div>
  );
}

export default App;
