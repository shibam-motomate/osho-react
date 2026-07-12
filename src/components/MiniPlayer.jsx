import { useEffect, useState } from 'react';
import { IcoNext, IcoPause, IcoPlay, IcoPrev } from './Icons.jsx';
import { SeriesImg } from './SeriesImg.jsx';

const fmt = s => { s = Math.floor(s || 0); const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60; return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${m}:${String(sec).padStart(2,'0')}`; };

/* ── Mini Player ── */
export function MiniPlayer({nowPlaying, isPlaying, onTogglePlay, onPrev, onNext, onOpen, audioRef}) {
  const [pct, setPct] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffering, setBuffering] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime  = () => { setCurrentTime(audio.currentTime); if (audio.duration > 0) setPct((audio.currentTime / audio.duration) * 100); };
    const onDur   = () => setDuration(audio.duration || 0);
    const onWait  = () => setBuffering(true);
    const onReady = () => setBuffering(false);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('durationchange', onDur);
    audio.addEventListener('loadedmetadata', onDur);
    audio.addEventListener('waiting', onWait);
    audio.addEventListener('canplay', onReady);
    audio.addEventListener('playing', onReady);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('durationchange', onDur);
      audio.removeEventListener('loadedmetadata', onDur);
      audio.removeEventListener('waiting', onWait);
      audio.removeEventListener('canplay', onReady);
      audio.removeEventListener('playing', onReady);
    };
  }, [audioRef]);

  const handleSeek = e => {
    e.stopPropagation();
    if (!duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    const newTime = Math.max(0, Math.min(duration, ((e.clientX - r.left) / r.width) * duration));
    if (audioRef.current) audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    setPct((newTime / duration) * 100);
  };

  return (
    <div className={`np${!nowPlaying?' gone':''}`} onClick={onOpen}>
      <div className="np-line" onClick={handleSeek}><div className="np-line-fill" style={{width:`${pct}%`}}/></div>
      <div className="np-inner">
        {nowPlaying && <SeriesImg series={nowPlaying.series} className="np-art" style={{width:44,height:44,borderRadius:10,border:'1px solid var(--border)',overflow:'hidden',flexShrink:0}}/>}
        <div className="np-info">
          <div className="np-ttl">{nowPlaying?.episode?.t}</div>
          <div className="np-ser">{nowPlaying?.series?.n}</div>
        </div>
        <button className="np-btn np-side" onClick={e => { e.stopPropagation(); onPrev(); }}><IcoPrev/></button>
        <button className="np-btn" onClick={e => { e.stopPropagation(); onTogglePlay(); }}>
          {buffering ? <div className="np-buf"/> : isPlaying ? <IcoPause s={22}/> : <IcoPlay s={22}/>}
        </button>
        <button className="np-btn np-side" onClick={e => { e.stopPropagation(); onNext(); }}><IcoNext/></button>
        <span className="np-time">{fmt(currentTime)} / {fmt(duration)}</span>
        <button className="np-btn np-expand" onClick={e => { e.stopPropagation(); onOpen(); }} title="Open player"
          style={{marginLeft:2}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 15l-6-6-6 6"/></svg>
        </button>
      </div>
    </div>
  );
}
