import { useEffect, useState } from 'react';
import { IcoBack30, IcoChevronRight, IcoDown, IcoFwd30, IcoNext, IcoPause, IcoPlay, IcoPrev, IcoSliders, IcoVolHi, IcoVolLo } from './Icons.jsx';
import { SeriesImg } from './SeriesImg.jsx';

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5];
const SLEEP_OPTIONS = [
  {value: 'off', label: 'Off'},
  {value: 15, label: '15m'},
  {value: 30, label: '30m'},
  {value: 60, label: '60m'},
  {value: 'end', label: 'End of talk'},
];

const fmtRemaining = s => { s = Math.max(0, Math.floor(s)); const m = Math.floor(s / 60), sec = s % 60; return `${m}:${String(sec).padStart(2, '0')}`; };

/* ── Full Player ── */
export function FullPlayer({open, onClose, nowPlaying, isPlaying, onTogglePlay, audioRef, onPrev, onNext, onSeekSeconds, t, isDesktop,
  playbackSpeed, setPlaybackSpeed, sleepOption, setSleepOption, sleepRemaining, episodeIndex, totalEpisodes, nextEpisode}) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [vol, setVol] = useState(80);
  const [buffering, setBuffering] = useState(false);
  const [loadPct, setLoadPct] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime    = () => setCurrentTime(audio.currentTime);
    const onDur     = () => setDuration(audio.duration || 0);
    const onWait    = () => setBuffering(true);
    const onReady   = () => setBuffering(false);
    const onLoadStart = () => setLoadPct(0);
    const onProgress = () => {
      if (audio.duration > 0 && audio.buffered.length > 0) {
        const end = audio.buffered.end(audio.buffered.length - 1);
        setLoadPct(Math.min(100, Math.round((end / audio.duration) * 100)));
      }
    };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('durationchange', onDur);
    audio.addEventListener('loadedmetadata', onDur);
    audio.addEventListener('waiting', onWait);
    audio.addEventListener('canplay', onReady);
    audio.addEventListener('playing', onReady);
    audio.addEventListener('loadstart', onLoadStart);
    audio.addEventListener('progress', onProgress);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('durationchange', onDur);
      audio.removeEventListener('loadedmetadata', onDur);
      audio.removeEventListener('waiting', onWait);
      audio.removeEventListener('canplay', onReady);
      audio.removeEventListener('playing', onReady);
      audio.removeEventListener('loadstart', onLoadStart);
      audio.removeEventListener('progress', onProgress);
    };
  }, [audioRef]);

  useEffect(() => { if (audioRef.current) audioRef.current.volume = vol / 100; }, [vol, audioRef]);

  if (!nowPlaying) return null;
  const {series, episode} = nowPlaying;
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const fmt = s => { s = Math.floor(s || 0); const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60; return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${m}:${String(sec).padStart(2,'0')}`; };

  const handleSeek = e => {
    const r = e.currentTarget.getBoundingClientRect();
    const newTime = ((e.clientX - r.left) / r.width) * duration;
    if (audioRef.current) audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const sleepStatus = sleepOption === 'off' ? '' : sleepOption === 'end' ? 'After this talk' : fmtRemaining(sleepRemaining);

  return (
    <>
      <div className={`player-scrim${open?' open':''}`} onClick={onClose}/>
      <div className={`player${open?' open':''}`}>
      <div className="player-handle"/>
      <div className="player-top">
        <button className="player-down" onClick={onClose}>{isDesktop ? <IcoChevronRight/> : <IcoDown/>}</button>
        <div className="player-lbl">{t.nowPlaying}</div>
        <div style={{width:34}}/>
      </div>
      <div className="player-body">
        <div className={`art-wrap${isPlaying?' playing':''}`}>
          <SeriesImg series={series} style={{width:'100%',height:'100%',borderRadius:26,overflow:'hidden'}} className=""/>
          {buffering && (
            <div className="buf-overlay">
              <div className="buf-ring"/>
              {loadPct > 0 && loadPct < 100 && <div className="buf-pct">{loadPct}%</div>}
            </div>
          )}
        </div>
        <div className="player-ep">{episode.t}</div>
        <div className="player-ser">{series.n}</div>
        {episodeIndex >= 0 && totalEpisodes > 0 && (
          <div className="player-position">Episode {episodeIndex + 1} of {totalEpisodes}</div>
        )}
        <div className="prog-wrap">
          <div className="prog-track" onClick={handleSeek}>
            <div className="prog-fill" style={{width:`${pct}%`}}/>
          </div>
          <div className="prog-times"><span>{fmt(currentTime)}</span><span>{fmt(duration) || episode.d}</span></div>
        </div>
        <div className="ctrl-row">
          <button className="ctrl-side" onClick={onPrev} aria-label="Previous episode"><IcoPrev/></button>
          <button className="ctrl-skip" onClick={() => onSeekSeconds(-30)} aria-label="Back 30 seconds"><IcoBack30/></button>
          <button className="ctrl-big" onClick={onTogglePlay}>{isPlaying ? <IcoPause s={26}/> : <IcoPlay s={26}/>}</button>
          <button className="ctrl-skip" onClick={() => onSeekSeconds(30)} aria-label="Forward 30 seconds"><IcoFwd30/></button>
          <button className="ctrl-side" onClick={onNext} aria-label="Next episode"><IcoNext/></button>
        </div>
        {nextEpisode && (
          <div className="player-upnext" onClick={onNext}>
            <span className="lbl">Up Next</span>
            <span className="ttl">{nextEpisode.t}</span>
          </div>
        )}

        <button className="player-more-toggle" onClick={() => setMoreOpen(o => !o)} aria-expanded={moreOpen}>
          <span className="lbl"><IcoSliders s={13}/> {playbackSpeed}&times; &middot; Sleep {sleepOption==='off' ? 'off' : sleepOption==='end' ? 'end of talk' : sleepStatus}</span>
          <span className={`chev${moreOpen?' open':''}`}><IcoDown/></span>
        </button>
        <div className={`player-more-wrap${moreOpen?' open':''}`}>
          <div className="player-more-inner">
            <div className="player-sec-lbl">Playback speed</div>
            <div className="player-seg">
              {SPEED_OPTIONS.map(sp => (
                <button key={sp} className={`player-seg-btn${playbackSpeed===sp?' active':''}`} onClick={() => setPlaybackSpeed(sp)}>{sp}×</button>
              ))}
            </div>

            <div className="player-status-row">
              <span className="player-sec-lbl" style={{marginBottom:0}}>Sleep timer</span>
              <span className="val">{sleepStatus}</span>
            </div>
            <div className="player-seg">
              {SLEEP_OPTIONS.map(opt => (
                <button key={opt.value} className={`player-seg-btn${sleepOption===opt.value?' active':''}`} onClick={() => setSleepOption(opt.value)}>{opt.label}</button>
              ))}
            </div>

            <div className="vol-row">
              <span className="vol-ic"><IcoVolLo/></span>
              <input type="range" className="vol-range" min="0" max="100" value={vol} onChange={e => setVol(Number(e.target.value))}/>
              <span className="vol-ic"><IcoVolHi/></span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
