import { useState } from 'react';
import { isVideoId } from '../config.js';
import { useMediaState } from '../lib/useMediaState.js';
import { IcoDown, IcoHeart, IcoNext, IcoPause, IcoPlay, IcoPrev, IcoSkipBack, IcoSkipFwd, IcoX } from './Icons.jsx';
import { LoadRing } from './LoadRing.jsx';
import { Scrubber } from './Scrubber.jsx';
import { SeriesImg } from './SeriesImg.jsx';
import { VolumeControl } from './VolumeControl.jsx';

const fmt = s => { s = Math.floor(s || 0); const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60; return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${m}:${String(sec).padStart(2,'0')}`; };

/* ── Mini player. Phone: a floating pill above the tab bar (art, title, play, close) with a
   thin progress line (it shimmers while a talk is loading). Desktop: a floating pill over the
   page — transport on the left (previous · back 10 s · play · forward 10 s · next), a "now
   playing" panel in the middle (art, title, series, time, and a thin seek bar along its bottom
   edge), and heart · volume · open · close on the right. The phone pill is the same design cut
   down: the panel (with a progress line along its bottom edge), then play and close.
   Clicking it opens the full player.
   If the talk failed to load, the subtitle says so and play becomes "retry". ── */
export function MiniPlayer({nowPlaying, isPlaying, onTogglePlay, onPrev, onNext, onSeekSeconds, onOpen, onClose, onOpenSeries, liked, onToggleLike, audioRef, videoRef, isDesktop,
  mediaError, onRetry}) {
  const {currentTime, duration, loading, bufferedEnd, loadPct} = useMediaState(audioRef, videoRef);
  const [previewTime, setPreviewTime] = useState(null); // while dragging the desktop seek bar

  const isVideo = !!nowPlaying && isVideoId(nowPlaying.series.i);
  const activeRef = isVideo ? videoRef : audioRef;

  const seekTo = time => { if (activeRef.current) activeRef.current.currentTime = time; };
  const pct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const showLoading = !mediaError && !!nowPlaying && loading && isPlaying;

  const playBtn = cls => (
    <button className={cls} onClick={e => { e.stopPropagation(); mediaError ? onRetry?.() : onTogglePlay(); }}
      aria-label={mediaError ? 'Try again' : isPlaying ? 'Pause' : 'Play'}>
      {showLoading ? <LoadRing pct={loadPct} size={30}/> : isPlaying ? <IcoPause s={20}/> : <IcoPlay s={22}/>}
    </button>
  );

  if (isDesktop) return (
    <div className={`np npd${!nowPlaying?' gone':''}`} onClick={onOpen} role="button" tabIndex={nowPlaying ? 0 : -1} aria-label="Open player">
      <div className="npd-transport">
        <button className="np-btn" onClick={e => { e.stopPropagation(); onPrev(); }} aria-label="Previous talk"><IcoPrev s={20}/></button>
        <button className="np-btn" onClick={e => { e.stopPropagation(); onSeekSeconds?.(-10); }} aria-label="Back 10 seconds"><IcoSkipBack s={28}/></button>
        {playBtn('npd-play')}
        <button className="np-btn" onClick={e => { e.stopPropagation(); onSeekSeconds?.(10); }} aria-label="Forward 10 seconds"><IcoSkipFwd s={28}/></button>
        <button className="np-btn" onClick={e => { e.stopPropagation(); onNext(); }} aria-label="Next talk"><IcoNext s={20}/></button>
      </div>
      <div className="npd-now">
        {nowPlaying && <SeriesImg series={nowPlaying.series} img={isVideo ? nowPlaying.episode.img : undefined} className="np-art"/>}
        <div className="np-info">
          <div className="np-ttl">{nowPlaying?.episode?.t}</div>
          {mediaError
            ? <div className="np-ser np-err" role="alert">Couldn't load · press play to retry</div>
            : <div className="np-ser" onClick={e => { e.stopPropagation(); onOpenSeries?.(); }}>{nowPlaying?.series?.n}</div>}
        </div>
        <span className="npd-time">{showLoading && previewTime == null ? `Loading ${loadPct}%` : `${fmt(previewTime ?? currentTime)} / ${duration > 0 ? fmt(duration) : (nowPlaying?.episode?.d || '–')}`}</span>
        <Scrubber className="np-scrub npd-scrub" currentTime={currentTime} duration={duration} bufferedEnd={bufferedEnd} loading={showLoading}
          onSeek={seekTo} onPreview={setPreviewTime} label="Position in talk"/>
      </div>
      <div className="npd-tools">
        <button className={`np-btn${liked ? ' on' : ''}`} onClick={e => { e.stopPropagation(); onToggleLike?.(); }} aria-label={liked ? 'Remove from saved' : 'Save talk'}><IcoHeart s={20} filled={liked}/></button>
        <VolumeControl/>
        <button className="np-btn" onClick={e => { e.stopPropagation(); onOpen(); }} aria-label="Open player" style={{transform:'rotate(180deg)'}}><IcoDown s={22}/></button>
        <button className="np-btn" onClick={e => { e.stopPropagation(); onClose?.(); }} aria-label="Close player"><IcoX s={18}/></button>
      </div>
    </div>
  );

  return (
    <div className={`np${!nowPlaying?' gone':''}`} onClick={onOpen} role="button" tabIndex={nowPlaying ? 0 : -1} aria-label="Open player">
      <div className="npd-now npm-now">
        {nowPlaying && <SeriesImg series={nowPlaying.series} img={isVideo ? nowPlaying.episode.img : undefined} className="np-art"/>}
        <div className="np-info">
          <div className="np-ttl">{nowPlaying?.episode?.t}</div>
          {mediaError
            ? <div className="np-ser np-err" role="alert">Couldn't load · tap play to retry</div>
            : <div className="np-ser" onClick={e => { e.stopPropagation(); onOpenSeries?.(); }}>{nowPlaying?.series?.n}</div>}
        </div>
        {nowPlaying && (
          <div className={`np-line${showLoading ? ' loading' : ''}`} aria-hidden="true"><div className="np-line-fill" style={{width:`${showLoading ? loadPct : pct}%`}}/></div>
        )}
      </div>
      {playBtn('npd-play')}
      <button className="np-btn" onClick={e => { e.stopPropagation(); onClose?.(); }} aria-label="Close player"><IcoX s={20}/></button>
    </div>
  );
}
