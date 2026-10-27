import { useState } from 'react';
import { isVideoId } from '../config.js';
import { useMediaState } from '../lib/useMediaState.js';
import { IcoDown, IcoHeart, IcoNext, IcoPause, IcoPlay, IcoPrev, IcoSkipBack, IcoSkipFwd, IcoX } from './Icons.jsx';
import { Scrubber } from './Scrubber.jsx';
import { SeriesImg } from './SeriesImg.jsx';

const fmt = s => { s = Math.floor(s || 0); const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60; return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${m}:${String(sec).padStart(2,'0')}`; };

/* ── Mini player. Phone: a floating pill above the tab bar (art, title, play, close) with a
   thin progress line (it shimmers while a talk is loading). Desktop: a docked bar with
   previous · back 10 s · play · forward 10 s · next, and the seek bar. Tapping it opens the
   full player. If the talk failed to load, the subtitle says so and play becomes "retry". ── */
export function MiniPlayer({nowPlaying, isPlaying, onTogglePlay, onPrev, onNext, onSeekSeconds, onOpen, onClose, onOpenSeries, liked, onToggleLike, audioRef, videoRef, isDesktop,
  mediaError, onRetry}) {
  const {currentTime, duration, loading, bufferedEnd} = useMediaState(audioRef, videoRef);
  const [previewTime, setPreviewTime] = useState(null); // while dragging the desktop seek bar

  const isVideo = !!nowPlaying && isVideoId(nowPlaying.series.i);
  const activeRef = isVideo ? videoRef : audioRef;

  const seekTo = time => { if (activeRef.current) activeRef.current.currentTime = time; };
  const pct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const showLoading = !mediaError && !!nowPlaying && loading && (isPlaying || !duration);

  const playBtn = cls => (
    <button className={cls} onClick={e => { e.stopPropagation(); mediaError ? onRetry?.() : onTogglePlay(); }}
      aria-label={mediaError ? 'Try again' : isPlaying ? 'Pause' : 'Play'}>
      {showLoading && isPlaying ? <div className="np-buf"/> : isPlaying ? <IcoPause s={22}/> : <IcoPlay s={24}/>}
    </button>
  );

  return (
    <div className={`np${!nowPlaying?' gone':''}`} onClick={onOpen} role="button" tabIndex={nowPlaying ? 0 : -1} aria-label="Open player">
      <div className="np-left">
        {nowPlaying && <SeriesImg series={nowPlaying.series} img={isVideo ? nowPlaying.episode.img : undefined} className="np-art"/>}
        <div className="np-info">
          <div className="np-ttl">{nowPlaying?.episode?.t}</div>
          {mediaError
            ? <div className="np-ser np-err" role="alert">Couldn't load · tap play to retry</div>
            : <div className="np-ser" onClick={e => { e.stopPropagation(); onOpenSeries?.(); }}>{nowPlaying?.series?.n}</div>}
        </div>
        {!isDesktop && (
          <>
            {playBtn('np-mob-play')}
            <button className="np-btn" onClick={e => { e.stopPropagation(); onClose?.(); }} aria-label="Close player"><IcoX s={20}/></button>
          </>
        )}
      </div>

      {!isDesktop && nowPlaying && (
        <div className={`np-line${showLoading && !duration ? ' loading' : ''}`} aria-hidden="true"><div className="np-line-fill" style={{width:`${pct}%`}}/></div>
      )}

      {isDesktop && (
        <>
          <div className="np-center">
            <div className="np-center-transport">
              <button className="np-btn" onClick={e => { e.stopPropagation(); onPrev(); }} aria-label="Previous talk"><IcoPrev s={24}/></button>
              <button className="np-btn" onClick={e => { e.stopPropagation(); onSeekSeconds?.(-10); }} aria-label="Back 10 seconds"><IcoSkipBack s={30}/></button>
              {playBtn('np-center-play')}
              <button className="np-btn" onClick={e => { e.stopPropagation(); onSeekSeconds?.(10); }} aria-label="Forward 10 seconds"><IcoSkipFwd s={30}/></button>
              <button className="np-btn" onClick={e => { e.stopPropagation(); onNext(); }} aria-label="Next talk"><IcoNext s={24}/></button>
            </div>
            <div className="np-center-seek">
              <span className="np-time-sm">{showLoading && previewTime == null ? 'Loading…' : fmt(previewTime ?? currentTime)}</span>
              <Scrubber className="np-scrub" currentTime={currentTime} duration={duration} bufferedEnd={bufferedEnd} loading={showLoading}
                onSeek={seekTo} onPreview={setPreviewTime} label="Position in talk"/>
              <span className="np-time-sm">{fmt(duration)}</span>
            </div>
          </div>
          <div className="np-right">
            <button className={`np-btn${liked ? ' on' : ''}`} onClick={e => { e.stopPropagation(); onToggleLike?.(); }} aria-label={liked ? 'Remove from saved' : 'Save talk'}><IcoHeart s={22} filled={liked}/></button>
            <button className="np-btn" onClick={e => { e.stopPropagation(); onOpen(); }} aria-label="Open player" style={{transform:'rotate(180deg)'}}><IcoDown s={24}/></button>
            <button className="np-btn" onClick={e => { e.stopPropagation(); onClose?.(); }} aria-label="Close player"><IcoX s={20}/></button>
          </div>
        </>
      )}
    </div>
  );
}
