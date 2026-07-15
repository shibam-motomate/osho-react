import { useEffect, useState } from 'react';
import { isVideoId } from '../config.js';
import { IcoNext, IcoPause, IcoPlay, IcoPrev } from './Icons.jsx';
import { SeriesImg } from './SeriesImg.jsx';

const fmt = s => { s = Math.floor(s || 0); const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60; return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${m}:${String(sec).padStart(2,'0')}`; };

/* ── Mini Player ── */
export function MiniPlayer({nowPlaying, isPlaying, onTogglePlay, onPrev, onNext, onOpen, audioRef, videoRef}) {
  const [pct, setPct] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffering, setBuffering] = useState(false);

  const isVideo = !!nowPlaying && isVideoId(nowPlaying.series.i);
  const activeRef = isVideo ? videoRef : audioRef;

  // Both elements stay mounted for the session — listen on both, only the one
  // actually loaded/playing will ever fire.
  useEffect(() => {
    const onTime  = e => { setCurrentTime(e.target.currentTime); if (e.target.duration > 0) setPct((e.target.currentTime / e.target.duration) * 100); };
    const onDur   = e => setDuration(e.target.duration || 0);
    const onWait  = () => setBuffering(true);
    const onReady = () => setBuffering(false);
    const els = [audioRef.current, videoRef.current].filter(Boolean);
    els.forEach(el => {
      el.addEventListener('timeupdate', onTime);
      el.addEventListener('durationchange', onDur);
      el.addEventListener('loadedmetadata', onDur);
      el.addEventListener('waiting', onWait);
      el.addEventListener('canplay', onReady);
      el.addEventListener('playing', onReady);
    });
    return () => els.forEach(el => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('durationchange', onDur);
      el.removeEventListener('loadedmetadata', onDur);
      el.removeEventListener('waiting', onWait);
      el.removeEventListener('canplay', onReady);
      el.removeEventListener('playing', onReady);
    });
  }, [audioRef, videoRef]);

  const handleSeek = e => {
    e.stopPropagation();
    if (!duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    const newTime = Math.max(0, Math.min(duration, ((e.clientX - r.left) / r.width) * duration));
    if (activeRef.current) activeRef.current.currentTime = newTime;
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
