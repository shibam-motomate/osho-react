import { useEffect, useMemo, useState } from 'react';
import { isVideoId } from '../config.js';
import { IcoBack30, IcoFullscreen, IcoFwd30, IcoLink, IcoMinimize, IcoMoon, IcoNext, IcoPause, IcoPlay, IcoPrev, IcoSpeed } from './Icons.jsx';
import { SeriesImg } from './SeriesImg.jsx';

const SPEED_SEQ = [1, 1.25, 1.5, 2, 0.75];
const SLEEP_SEQ = ['off', 15, 30, 60, 'end'];

const fmtRemaining = s => { s = Math.max(0, Math.floor(s)); const m = Math.floor(s / 60), sec = s % 60; return `${m}:${String(sec).padStart(2, '0')}`; };

/* ── Full Player — YouTube-style dark panel that slides up over everything.
   Audio series get a centered artwork "listen" layout; video series get a 16:9
   watch frame. Both share an "Up next" rail (right column on desktop, stacked on
   mobile). The <video> element stays permanently mounted (never conditionally
   removed) so App.jsx's videoRef is always valid — it's just hidden in audio mode. */
export function FullPlayer({open, onClose, nowPlaying, isPlaying, onTogglePlay, audioRef, videoRef, onPrev, onNext, onSeekSeconds, t, isDesktop,
  playbackSpeed, setPlaybackSpeed, sleepOption, setSleepOption, sleepRemaining, episodeIndex, totalEpisodes, onOpenSeries, onPlayEpisode, onShare}) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffering, setBuffering] = useState(false);

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

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const fmt = s => { s = Math.floor(s || 0); const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60; return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${m}:${String(sec).padStart(2,'0')}`; };

  const handleSeek = e => {
    if (!duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    const newTime = Math.max(0, Math.min(duration, ((e.clientX - r.left) / r.width) * duration));
    if (activeRef.current) activeRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const cycleSpeed = () => setPlaybackSpeed(SPEED_SEQ[(SPEED_SEQ.indexOf(playbackSpeed) + 1 + SPEED_SEQ.length) % SPEED_SEQ.length]);
  const cycleSleep = () => setSleepOption(SLEEP_SEQ[(SLEEP_SEQ.indexOf(sleepOption) + 1 + SLEEP_SEQ.length) % SLEEP_SEQ.length]);
  const sleepLabel = sleepOption === 'off' ? 'Sleep' : sleepOption === 'end' ? 'End' : fmtRemaining(sleepRemaining) || `${sleepOption}m`;

  const goFullscreen = () => { const el = videoRef.current; if (el?.requestFullscreen) el.requestFullscreen().catch(() => {}); };

  const epPosition = episodeIndex >= 0 && totalEpisodes > 0 ? `Episode ${episodeIndex + 1} of ${totalEpisodes}` : '';
  const channelInitial = series ? series.n.trim().charAt(0).toUpperCase() : 'O';

  const upNext = useMemo(() => {
    const eps = series?.e || [];
    const cur = episodeIndex;
    return eps.map((ep, idx) => ({ep, idx}))
      .filter(o => o.idx !== cur)
      .sort((a, b) => ((a.idx > cur ? 0 : 1) - (b.idx > cur ? 0 : 1)) || a.idx - b.idx)
      .slice(0, 20);
  }, [series, episodeIndex]);

  const chips = isVideo ? (
    <div className="dp-chips">
      <button className="dp-chip" onClick={() => onSeekSeconds(-30)}><IcoBack30/>30s</button>
      <button className="dp-chip" onClick={() => onSeekSeconds(30)}><IcoFwd30/>30s</button>
      <button className="dp-chip" onClick={cycleSpeed}><IcoSpeed/>{playbackSpeed}×</button>
      <button className="dp-chip" onClick={onShare}><IcoLink/>Share</button>
    </div>
  ) : (
    <div className="dp-chips center">
      <button className="dp-chip" onClick={cycleSpeed}><IcoSpeed/>{playbackSpeed}×</button>
      <button className="dp-chip" onClick={cycleSleep}><IcoMoon/>{sleepLabel}</button>
      <button className="dp-chip" onClick={onShare}><IcoLink/>Share</button>
    </div>
  );

  const channelRow = (
    <div className="dp-channel">
      <div className="dp-avatar">{series ? <SeriesImg series={series} style={{width:'100%',height:'100%'}} className="dp-avatar-img"/> : channelInitial}</div>
      <div className="dp-channel-info">
        <div className="dp-channel-name">{series?.n}</div>
        <div className="dp-channel-sub">Osho International</div>
      </div>
      <button className="dp-view-series" onClick={onOpenSeries}>View series</button>
    </div>
  );

  const rail = (
    <div className="dp-rail">
      <div className="dp-rail-hdr">Up next</div>
      <div className="dp-rail-list">
        {upNext.map(({ep, idx}) => (
          <div key={ep.u} className="dp-up" onClick={() => onPlayEpisode(ep)}>
            <div className={`dp-up-thumb${isVideo?' video':''}`}>
              <SeriesImg series={series} img={ep.img} style={{width:'100%',height:'100%'}} className="dp-up-thumb-img"/>
              <span className="dp-up-dur">{ep.d}</span>
            </div>
            <div className="dp-up-info">
              <div className="dp-up-title">{ep.t}</div>
              <div className="dp-up-sub">{series?.n}</div>
              <div className="dp-up-sub">Episode {idx + 1}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`dp-panel${open?' open':''}`}>
      <div className="dp-topbar">
        <button className="dp-min" onClick={onClose} aria-label="Minimize"><IcoMinimize/></button>
        <span className="dp-wordmark">Osho <span>{isVideo ? 'Watch' : 'Listen'}</span></span>
      </div>

      <div className="dp-scroll">
        <div className={`dp-wrap${isDesktop?' desk':''}`}>
          <div className="dp-main">
            {/* Video frame (always mounted so videoRef stays valid; hidden in audio mode) */}
            <div className="dp-video-frame" style={{display: isVideo ? 'block' : 'none'}}>
              <video ref={videoRef} playsInline preload="none" onClick={onTogglePlay} className="dp-video"/>
              {isVideo && (
                <>
                  <div className="dp-video-scrim top"/>
                  <div className="dp-video-scrim bottom"/>
                  <button className="dp-video-play" onClick={onTogglePlay} aria-label="Play/pause">
                    {isPlaying ? <IcoPause s={32}/> : <IcoPlay s={34}/>}
                  </button>
                  <div className="dp-video-bar">
                    <div className="dp-video-times">
                      <span className="strong">{fmt(currentTime)}</span>
                      <span className="dim">/ {fmt(duration) || episode?.d}</span>
                      <div style={{flex:1}}/>
                      <button className="dp-video-fs" onClick={goFullscreen} aria-label="Fullscreen"><IcoFullscreen/></button>
                    </div>
                    <div className="dp-seek red" onClick={handleSeek}>
                      <div className="dp-seek-fill" style={{width:`${pct}%`}}><span className="dp-seek-dot"/></div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {isVideo ? (
              <>
                <div className="dp-info-pad">
                  <div className="dp-title left">{episode?.t}</div>
                  <div className="dp-sub" onClick={onOpenSeries}>{series?.n}{epPosition && ` · ${epPosition}`}</div>
                </div>
                {chips}
                <div className="dp-divider"/>
                {channelRow}
              </>
            ) : (
              <div className="dp-audio">
                <div className="dp-art">
                  {series && <SeriesImg series={series} style={{width:'100%',height:'100%'}} className="dp-art-img"/>}
                  {buffering && <div className="dp-buf"><div className="buf-ring"/></div>}
                </div>
                <div className="dp-title-block">
                  <div className="dp-title">{episode?.t}</div>
                  <div className="dp-sub" onClick={onOpenSeries}>{series?.n}{epPosition && ` · ${epPosition}`}</div>
                </div>
                <div className="dp-progress">
                  <div className="dp-seek red" onClick={handleSeek}>
                    <div className="dp-seek-fill" style={{width:`${pct}%`}}><span className="dp-seek-dot"/></div>
                  </div>
                  <div className="dp-times"><span>{fmt(currentTime)}</span><span>{fmt(duration) || episode?.d}</span></div>
                </div>
                <div className="dp-controls">
                  <button className="dp-ctrl" onClick={onPrev} aria-label="Previous"><IcoPrev/></button>
                  <button className="dp-ctrl" onClick={() => onSeekSeconds(-30)} aria-label="Back 30 seconds"><IcoBack30/></button>
                  <button className="dp-play" onClick={onTogglePlay} aria-label="Play/pause">
                    {isPlaying ? <IcoPause s={28}/> : <IcoPlay s={30}/>}
                  </button>
                  <button className="dp-ctrl" onClick={() => onSeekSeconds(30)} aria-label="Forward 30 seconds"><IcoFwd30/></button>
                  <button className="dp-ctrl" onClick={onNext} aria-label="Next"><IcoNext/></button>
                </div>
                {chips}
                <div className="dp-divider"/>
                {channelRow}
              </div>
            )}
          </div>
          {rail}
        </div>
      </div>
    </div>
  );
}
