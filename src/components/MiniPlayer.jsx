import { useEffect, useState } from 'react';
import { isVideoId } from '../config.js';
import { IcoExpandDiag, IcoHeart, IcoNext, IcoPause, IcoPlay, IcoPrev, IcoRepeat, IcoShuffle, IcoVolHi, IcoX } from './Icons.jsx';
import { SeriesImg } from './SeriesImg.jsx';

const fmt = s => { s = Math.floor(s || 0); const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60; return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${m}:${String(sec).padStart(2,'0')}`; };

/* ── Mini Player — slim persistent bar (bottom on mobile, docked player region on
   desktop). Tapping it opens the full player. ── */
export function MiniPlayer({nowPlaying, isPlaying, onTogglePlay, onPrev, onNext, onOpen, onClose, onOpenSeries, liked, onToggleLike, audioRef, videoRef, isDesktop}) {
  const [pct, setPct] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffering, setBuffering] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);

  const isVideo = !!nowPlaying && isVideoId(nowPlaying.series.i);
  const activeRef = isVideo ? videoRef : audioRef;

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

  // Repeat loops the current track on the actual media element.
  useEffect(() => {
    [audioRef.current, videoRef.current].filter(Boolean).forEach(el => { el.loop = repeat; });
  }, [repeat, audioRef, videoRef, nowPlaying]);

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
        <div className="np-left">
          {nowPlaying && <SeriesImg series={nowPlaying.series} className="np-art" style={{width:44,height:44,borderRadius:10,border:'1px solid var(--border)',overflow:'hidden',flexShrink:0}}/>}
          <div className="np-info">
            <div className="np-ttl">{nowPlaying?.episode?.t}</div>
            <div className="np-ser" onClick={e => { e.stopPropagation(); onOpenSeries?.(); }}>{nowPlaying?.series?.n}</div>
          </div>
          {!isDesktop && (
            <>
              <button className="np-btn np-mob-like" onClick={e => { e.stopPropagation(); onToggleLike?.(); }} aria-label="Save"><IcoHeart s={18} filled={liked}/></button>
              <button className="np-mob-play" onClick={e => { e.stopPropagation(); onTogglePlay(); }} aria-label="Play/pause">
                {buffering ? <div className="np-buf light"/> : isPlaying ? <IcoPause s={16}/> : <IcoPlay s={16}/>}
              </button>
              <button className="np-btn np-mob-close" onClick={e => { e.stopPropagation(); onClose?.(); }} aria-label="Close player"><IcoX/></button>
            </>
          )}
        </div>

        {isDesktop && (
          <>
            <div className="np-center">
              <div className="np-center-transport">
                <button className="np-btn np-transport" onClick={e => { e.stopPropagation(); onPrev(); }} aria-label="Previous"><IcoPrev/></button>
                <button className="np-center-play" onClick={e => { e.stopPropagation(); onTogglePlay(); }} aria-label="Play/pause">
                  {buffering ? <div className="np-buf light"/> : isPlaying ? <IcoPause s={17}/> : <IcoPlay s={18}/>}
                </button>
                <button className="np-btn np-transport" onClick={e => { e.stopPropagation(); onNext(); }} aria-label="Next"><IcoNext/></button>
              </div>
              <div className="np-center-seek">
                <span className="np-time-sm">{fmt(currentTime)}</span>
                <div className="np-seek" onClick={handleSeek}><div className="np-seek-fill" style={{width:`${pct}%`}}/></div>
                <span className="np-time-sm">{fmt(duration)}</span>
              </div>
            </div>

            <div className="np-right">
              <button className="np-btn" onClick={e => { e.stopPropagation(); onToggleLike?.(); }} aria-label="Save"><IcoHeart s={19} filled={liked}/></button>
              <button className={`np-btn${shuffle?' on':''}`} onClick={e => { e.stopPropagation(); setShuffle(v => !v); }} aria-label="Shuffle"><IcoShuffle s={18}/></button>
              <button className={`np-btn${repeat?' on':''}`} onClick={e => { e.stopPropagation(); setRepeat(v => !v); }} aria-label="Repeat"><IcoRepeat s={18}/></button>
              <span className="np-vol"><IcoVolHi/></span>
              <button className="np-btn" onClick={e => { e.stopPropagation(); onOpen(); }} aria-label="Expand"><IcoExpandDiag s={18}/></button>
              <button className="np-btn np-close" onClick={e => { e.stopPropagation(); onClose?.(); }} aria-label="Close player"><IcoX/></button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
