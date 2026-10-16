import { useEffect, useState } from 'react';
import { isVideoId } from '../config.js';
import { onActivateKey } from '../lib/a11y.js';
import { IcoBack30, IcoDown, IcoFullscreen, IcoFwd30, IcoHeart, IcoList, IcoMoon, IcoNext, IcoPause, IcoPlay, IcoPrev, IcoShare, IcoSpeed, IcoX, Wave } from './Icons.jsx';
import { SeriesImg } from './SeriesImg.jsx';
import { fmtDur } from './SeriesScreen.jsx';

const SPEED_SEQ = [1, 1.25, 1.5, 2, 0.75];
const SLEEP_SEQ = ['off', 15, 30, 60, 'end'];

const fmtRemaining = s => { s = Math.max(0, Math.floor(s)); const m = Math.floor(s / 60), sec = s % 60; return `${m}:${String(sec).padStart(2, '0')}`; };
const fmt = s => { s = Math.floor(s || 0); const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60; return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${m}:${String(sec).padStart(2,'0')}`; };

/* ── Full player: the photograph fills the screen; title, progress and the five controls
   sit on a dark gradient at the bottom. Video talks show the <video> frame at the top
   (it stays mounted so App.jsx's videoRef is always valid). "Up next" is a sheet. ── */
export function FullPlayer({open, onClose, nowPlaying, isPlaying, onTogglePlay, audioRef, videoRef, onPrev, onNext, onSeekSeconds, t, isDesktop,
  playbackSpeed, setPlaybackSpeed, sleepOption, setSleepOption, sleepRemaining, episodeIndex, totalEpisodes, onOpenSeries, onPlayEpisode, onShare, liked, onToggleLike}) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffering, setBuffering] = useState(false);
  const [upOpen, setUpOpen] = useState(false);

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

  useEffect(() => { if (!open) setUpOpen(false); }, [open]);

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const remaining = duration > 0 ? duration - currentTime : 0;

  const handleSeek = e => {
    if (!duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    const newTime = Math.max(0, Math.min(duration, ((e.clientX - r.left) / r.width) * duration));
    if (activeRef.current) activeRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const cycleSpeed = () => setPlaybackSpeed(SPEED_SEQ[(SPEED_SEQ.indexOf(playbackSpeed) + 1 + SPEED_SEQ.length) % SPEED_SEQ.length]);
  const cycleSleep = () => setSleepOption(SLEEP_SEQ[(SLEEP_SEQ.indexOf(sleepOption) + 1 + SLEEP_SEQ.length) % SLEEP_SEQ.length]);
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

        <div className="prog-wrap">
          <div className="prog-track" onClick={handleSeek} role="slider" aria-label="Position" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
            <div className="prog-fill" style={{width:`${pct}%`}}/>
          </div>
          <div className="prog-times">
            <span>{fmt(currentTime)}</span>
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
          <button className="chip-glass" onClick={cycleSpeed}><IcoSpeed/>{t.speed} {playbackSpeed}×</button>
          <button className={`chip-glass${sleepOption !== 'off' ? ' on' : ''}`} onClick={cycleSleep}><IcoMoon/>{sleepLabel}</button>
          <button className="chip-glass" onClick={() => setUpOpen(true)}><IcoList/>{t.upNext}</button>
          <button className="chip-glass" onClick={onShare} aria-label="Share"><IcoShare s={16}/></button>
        </div>
      </div>

      <div className={`upnext${upOpen ? ' open' : ''}`} aria-hidden={!upOpen}>
        <div className="upnext-head">
          <div className="upnext-title">{series?.n}</div>
          <button className="icon-btn" onClick={() => setUpOpen(false)} aria-label="Close list"><IcoX s={18}/></button>
        </div>
        <div className="upnext-list">
          {eps.map((ep, idx) => {
            const active = idx === episodeIndex;
            const pick = () => { if (!active) onPlayEpisode(ep); setUpOpen(false); };
            return (
              <div key={ep.u} className="ep-row" onClick={pick} role="button" tabIndex={0} onKeyDown={onActivateKey(pick)}>
                <span className={`ep-play${active ? ' now' : ''}`} aria-hidden="true">{active && isPlaying ? <Wave/> : <IcoPlay s={22}/>}</span>
                <div className="ep-info">
                  <div className={`ep-name${active ? ' now' : ''}`}>{idx + 1} · {ep.t}</div>
                  <div className={`ep-sub${active ? ' now' : ''}`}>{active ? t.nowPlaying : fmtDur(ep.d)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
