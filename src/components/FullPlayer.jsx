import { useEffect, useState } from 'react';
import { isVideoId } from '../config.js';
import { onActivateKey } from '../lib/a11y.js';
import { SLEEP_OPTIONS, SPEEDS, speedLabel } from '../lib/playback.js';
import { IcoBack30, IcoCheck, IcoDown, IcoFullscreen, IcoFwd30, IcoHeart, IcoList, IcoMoon, IcoNext, IcoPause, IcoPlay, IcoPrev, IcoShare, IcoSpeed, IcoX, Wave } from './Icons.jsx';
import { Scrubber } from './Scrubber.jsx';
import { SeriesImg } from './SeriesImg.jsx';
import { fmtDur } from './SeriesScreen.jsx';
import './player.css';

const sleepName = o => o === 'off' ? 'Off' : o === 'end' ? 'End of this talk' : `${o} minutes`;

/* Bottom sheet inside the player (Up next, Speed, Sleep timer), with a scrim behind it. */
function Sheet({open, title, onClose, children}) {
  return (
    <>
      <div className={`psheet-scrim${open ? ' open' : ''}`} onClick={onClose} aria-hidden="true"/>
      <div className={`upnext${open ? ' open' : ''}`} role="dialog" aria-label={title} aria-hidden={!open}>
        <div className="upnext-head">
          <div className="upnext-title">{title}</div>
          <button className="icon-btn" onClick={onClose} aria-label="Close" tabIndex={open ? 0 : -1}><IcoX s={18}/></button>
        </div>
        {children}
      </div>
    </>
  );
}

const fmtRemaining = s => { s = Math.max(0, Math.floor(s)); const m = Math.floor(s / 60), sec = s % 60; return `${m}:${String(sec).padStart(2, '0')}`; };
const fmt = s => { s = Math.floor(s || 0); const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60; return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${m}:${String(sec).padStart(2,'0')}`; };

/* ── Full player: the photograph fills the screen; title, progress and the five controls
   sit on a dark gradient at the bottom. Video talks show the <video> frame at the top
   (it stays mounted so App.jsx's videoRef is always valid). "Up next" is a sheet. ── */
export function FullPlayer({open, onClose, nowPlaying, isPlaying, onTogglePlay, audioRef, videoRef, onPrev, onNext, onSeekSeconds, t, isDesktop,
  playbackSpeed, setPlaybackSpeed, sleepOption, setSleepOption, sleepRemaining, episodeIndex, totalEpisodes, onOpenSeries, onPlayEpisode, onShare, liked, onToggleLike,
  mediaError, onRetry}) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffering, setBuffering] = useState(false);
  const [sheet, setSheet] = useState(null); // null | 'upnext' | 'speed' | 'sleep'
  const [previewTime, setPreviewTime] = useState(null); // while dragging the seek bar

  const isVideo = !!nowPlaying && isVideoId(nowPlaying.series.i);
  const activeRef = isVideo ? videoRef : audioRef;
  const series = nowPlaying?.series;
  const episode = nowPlaying?.episode;

  useEffect(() => {
    const onTime  = e => setCurrentTime(e.target.currentTime);
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

  useEffect(() => { if (!open) setSheet(null); }, [open]);

  // Escape closes an open sheet first, then the player itself.
  useEffect(() => {
    if (!open) return;
    const onKey = e => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      if (sheet) setSheet(null); else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, sheet, onClose]);

  const shownTime = previewTime ?? currentTime;
  const remaining = duration > 0 ? duration - shownTime : 0;

  const seekTo = time => {
    if (activeRef.current) activeRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const pickSpeed = v => { setPlaybackSpeed(v); setSheet(null); };
  const pickSleep = o => { setSleepOption(o); setSheet(null); };
  const sleepLabel = sleepOption === 'off' ? t.sleep : sleepOption === 'end' ? 'Sleep: end of talk' : `Sleep ${fmtRemaining(sleepRemaining) || `${sleepOption}:00`}`;
  const goFullscreen = () => { const el = videoRef.current; if (el?.requestFullscreen) el.requestFullscreen().catch(() => {}); };

  const eps = series?.e || [];
  const position = episodeIndex >= 0 && totalEpisodes > 0 ? `Talk ${episodeIndex + 1} of ${totalEpisodes}` : '';

  return (
    <div className={`player${open ? ' open' : ''}${isVideo ? ' video-mode' : ''}`} aria-hidden={!open}>
      {series && <SeriesImg key={series.i} series={series} img={isVideo ? episode?.img : undefined} className="player-bg" plain/>}
      <div className="player-shade"/>

      <div className={`player-video-wrap${isVideo ? '' : ' audio'}`}>
        <video ref={videoRef} playsInline preload="none" onClick={onTogglePlay} className="player-video"/>
        {isVideo && (
          <button className="icon-btn on-photo" style={{position:'absolute',right:12,bottom:12}} onClick={goFullscreen} aria-label="Fullscreen"><IcoFullscreen/></button>
        )}
      </div>

      <div className="player-top">
        <button className="icon-btn on-photo" onClick={onClose} aria-label="Close player"><IcoDown/></button>
        <div className="player-lbl">{t.nowPlaying}</div>
        <button className="icon-btn on-photo" onClick={onToggleLike} aria-label={liked ? 'Remove from saved' : 'Save talk'}><IcoHeart s={22} filled={liked}/></button>
      </div>

      <div className="player-body">
        <div className="player-meta">
          <div className="player-ser" role="button" tabIndex={0} onClick={onOpenSeries} onKeyDown={onActivateKey(onOpenSeries)}>{position ? `${position} · ` : ''}{series?.n}</div>
          <div className="player-ep">{episode?.t}</div>
        </div>

        {mediaError && (
          <div className="pl-error" role="alert">
            <span>{mediaError}</span>
            <button onClick={onRetry}>Try again</button>
          </div>
        )}

        <div className="prog-wrap">
          <Scrubber currentTime={currentTime} duration={duration} onSeek={seekTo} onPreview={setPreviewTime} label="Position in talk"/>
          <div className={`prog-times${previewTime != null ? ' previewing' : ''}`}>
            <span>{fmt(shownTime)}</span>
            <span>{duration > 0 ? `${fmt(remaining)} ${t.left}` : (episode?.d ? fmtDur(episode.d) : '')}</span>
          </div>
        </div>

        <div className="ctrl-main">
          <button className="ctrl-side" onClick={onPrev} aria-label="Previous talk"><IcoPrev s={30}/></button>
          <button className="ctrl-skip" onClick={() => onSeekSeconds(-30)} aria-label="Back 30 seconds"><IcoBack30 s={30}/></button>
          <button className="ctrl-big" onClick={onTogglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
            {buffering && isPlaying ? <div className="buf-ring"/> : isPlaying ? <IcoPause s={36}/> : <IcoPlay s={38}/>}
          </button>
          <button className="ctrl-skip" onClick={() => onSeekSeconds(30)} aria-label="Forward 30 seconds"><IcoFwd30 s={30}/></button>
          <button className="ctrl-side" onClick={onNext} aria-label="Next talk"><IcoNext s={30}/></button>
        </div>

        <div className="ctrl-chips">
          <button className={`chip-glass${playbackSpeed !== 1 ? ' on' : ''}`} onClick={() => setSheet('speed')} aria-haspopup="dialog"><IcoSpeed/>{t.speed} {speedLabel(playbackSpeed)}</button>
          <button className={`chip-glass${sleepOption !== 'off' ? ' on' : ''}`} onClick={() => setSheet('sleep')} aria-haspopup="dialog"><IcoMoon/>{sleepLabel}</button>
          <button className="chip-glass" onClick={() => setSheet('upnext')} aria-haspopup="dialog"><IcoList/>{t.upNext}</button>
          <button className="chip-glass" onClick={onShare} aria-label="Share"><IcoShare s={16}/></button>
        </div>
      </div>

      <Sheet open={sheet === 'speed'} title={t.speed} onClose={() => setSheet(null)}>
        <div className="psheet-list" role="radiogroup" aria-label={t.speed}>
          {SPEEDS.map(v => (
            <button key={v} className={`opt-row${playbackSpeed === v ? ' active' : ''}`} role="radio" aria-checked={playbackSpeed === v}
              tabIndex={sheet === 'speed' ? 0 : -1} onClick={() => pickSpeed(v)}>
              <span className="opt-row-txt">{speedLabel(v)}{v === 1 && <span className="opt-row-sub">Normal</span>}</span>
              <span className="opt-row-check">{playbackSpeed === v && <IcoCheck s={20}/>}</span>
            </button>
          ))}
        </div>
      </Sheet>

      <Sheet open={sheet === 'sleep'} title={t.sleep} onClose={() => setSheet(null)}>
        {sleepOption !== 'off' && (
          <div className="psheet-note">{sleepOption === 'end' ? 'Stops when this talk ends.' : `Stops in ${fmtRemaining(sleepRemaining)}.`}</div>
        )}
        <div className="psheet-list" role="radiogroup" aria-label={t.sleep}>
          {SLEEP_OPTIONS.map(o => (
            <button key={o} className={`opt-row${sleepOption === o ? ' active' : ''}`} role="radio" aria-checked={sleepOption === o}
              tabIndex={sheet === 'sleep' ? 0 : -1} onClick={() => pickSleep(o)}>
              <span className="opt-row-txt">{sleepName(o)}</span>
              <span className="opt-row-check">{sleepOption === o && <IcoCheck s={20}/>}</span>
            </button>
          ))}
        </div>
      </Sheet>

      <Sheet open={sheet === 'upnext'} title={series?.n || t.upNext} onClose={() => setSheet(null)}>
        <div className="upnext-list">
          {eps.map((ep, idx) => {
            const active = idx === episodeIndex;
            const pick = () => { if (!active) onPlayEpisode(ep); setSheet(null); };
            return (
              <div key={ep.u} className="ep-row" onClick={pick} role="button" tabIndex={sheet === 'upnext' ? 0 : -1} onKeyDown={onActivateKey(pick)}>
                <span className={`ep-play${active ? ' now' : ''}`} aria-hidden="true">{active && isPlaying ? <Wave/> : <IcoPlay s={22}/>}</span>
                <div className="ep-info">
                  <div className={`ep-name${active ? ' now' : ''}`}>{idx + 1} · {ep.t}</div>
                  <div className={`ep-sub${active ? ' now' : ''}`}>{active ? t.nowPlaying : fmtDur(ep.d)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Sheet>
    </div>
  );
}
