import { useState } from 'react';
import { isVideoId, seriesTotalDuration } from '../config.js';
import { onActivateKey } from '../lib/a11y.js';
import { minutesLeft, percentDone } from '../lib/progress.js';
import { IcoBack, IcoCheck, IcoHeart, IcoPlay, IcoSearch, IcoShare, Wave } from './Icons.jsx';
import { SeriesImg } from './SeriesImg.jsx';

/* "1:26:56" → "1 h 27 min", "45:10" → "45 min" */
export const fmtDur = d => {
  const p = String(d || '').split(':').map(Number);
  const secs = p.length === 3 ? p[0]*3600 + p[1]*60 + p[2] : p.length === 2 ? p[0]*60 + p[1] : 0;
  const h = Math.floor(secs / 3600), m = Math.round((secs % 3600) / 60);
  return h > 0 ? `${h} h ${String(m).padStart(2, '0')} min` : `${m} min`;
};

/* ── Series: full-bleed cover with the title on it, one big Continue/Play button,
   then every talk as a row with its own play circle. ── */
export function SeriesScreen({series, onBack, onEpisode, onOpenPlayer, onTogglePlay, currentEp, isPlaying, audioPct, saved, onToggleSave, onShare, savedEpisodeUrls, onToggleSaveEpisode, progress = {}, t}) {
  const [epQ, setEpQ] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const isVideo = isVideoId(series.i);
  const episodes = series.e;
  const filtered = epQ ? episodes.filter(e => e.t.toLowerCase().includes(epQ.toLowerCase())) : episodes;
  const curIdx = currentEp ? episodes.findIndex(e => e.u === currentEp.u) : -1;
  const genre = t.genres[series.g] || series.g;

  // Where each talk stands: the one in the player reports live from the <audio>/<video>
  // element; every other talk falls back to its saved position (lib/progress.js).
  const isLive = ep => currentEp?.u === ep.u && audioPct > 0 && audioPct < 100;
  const pctOf  = ep => isLive(ep) ? audioPct : percentDone(progress[ep.u], secsOf(ep.d));
  const leftOf = ep => isLive(ep) ? Math.round((100 - audioPct) / 100 * secsOf(ep.d) / 60) : minutesLeft(progress[ep.u], secsOf(ep.d));
  const unfinished = ep => { const p = progress[ep.u]; return !!p && !p.done && p.t > 0; };

  // The big button resumes the talk in the player if it belongs to this series, otherwise
  // the first talk left part-way through; with neither, the series starts from talk 1.
  const resumeIdx = curIdx >= 0 ? curIdx : episodes.findIndex(unfinished);
  const resumeEp = resumeIdx >= 0 ? episodes[resumeIdx] : null;
  const resumeLeft = resumeEp ? leftOf(resumeEp) : 0;
  const primaryLabel = resumeEp
    ? (resumeLeft > 0 ? `${t.continueTalk(resumeIdx + 1)} · ${t.minLeft(resumeLeft)}` : t.continueTalk(resumeIdx + 1))
    : t.playFromStart;
  // "Continue" on the talk already in the player resumes it (it used to only open the player, paused).
  const primaryAction = () => {
    if (curIdx < 0) { onEpisode(resumeEp || episodes[0]); return; }
    onOpenPlayer();
    if (!isPlaying) onTogglePlay?.();
  };

  return (
    <div>
      <div className={`cover${isVideo ? ' video' : ''}`}>
        <SeriesImg series={series} className="cover-img" plain/>
        <div className="cover-shade"/>
        <div className="cover-top">
          <button className="back-btn on-photo" onClick={onBack}><IcoBack/>{t.back}</button>
          <div style={{display:'flex',gap:8}}>
            <button className="btn-pill on-photo" aria-label={saved ? 'Remove from saved' : 'Save series'} onClick={() => onToggleSave(series.i)}>
              <IcoHeart s={20} filled={saved}/>{saved ? t.savedBtn : t.saveBtn}
            </button>
            <button className="icon-btn on-photo" aria-label="Share" onClick={onShare}><IcoShare s={20}/></button>
          </div>
        </div>
        <div className="cover-bottom">
          <div className="eyebrow">{genre} · {t.talks(episodes.length)} · {seriesTotalDuration(series)}</div>
          <h1 className="cover-title">{series.n}</h1>
        </div>
      </div>

      {series.x && <p className="series-desc">{tidy(series.x)}</p>}

      <div className="series-actions">
        <button className="btn-primary" onClick={primaryAction}><IcoPlay s={22}/>{primaryLabel}</button>
        <button className={`btn-pill${showSearch ? ' on' : ''}`} aria-label={t.findTalk} onClick={() => setShowSearch(v => !v)}><IcoSearch s={20}/></button>
      </div>

      {showSearch && (
        <div className="ep-search" style={{paddingTop:12}}>
          <label className="sbar">
            <span style={{color:'var(--muted)',display:'flex'}}><IcoSearch s={20}/></span>
            <input value={epQ} onChange={e => setEpQ(e.target.value)} placeholder={t.searchEp} aria-label={t.searchEp} autoFocus/>
          </label>
        </div>
      )}

      <div className="sec-lbl">{t.talksLbl}</div>
      <div className="ep-list">
        {filtered.length === 0 && <div className="empty-state">{t.noEpisodes}</div>}
        {filtered.map(ep => {
          const idx = episodes.indexOf(ep);
          const active = currentEp?.u === ep.u;
          const savedEp = savedEpisodeUrls.has(ep.u);
          const open = () => active ? onOpenPlayer() : onEpisode(ep);
          const p = progress[ep.u];
          const pct = pctOf(ep);
          const partWay = isLive(ep) || (unfinished(ep) && pct > 0);
          const finished = !!p?.done && !isLive(ep);
          return (
            <div key={ep.u} className="ep-row" onClick={open} role="button" tabIndex={0} onKeyDown={onActivateKey(open)}>
              {isVideo ? (
                <div className="ep-thumb-wrap">
                  <SeriesImg series={series} img={ep.img} className="ep-thumb"/>
                  {active ? <div className="ep-thumb-playing">{isPlaying ? <Wave/> : <IcoPlay s={18}/>}</div> : <div className="ep-thumb-play"><IcoPlay s={18}/></div>}
                </div>
              ) : (
                <span className={`ep-play${active ? ' now' : ''}`} aria-hidden="true">
                  {active && isPlaying ? <Wave/> : <IcoPlay s={24}/>}
                </span>
              )}
              <div className="ep-info">
                <div className={`ep-name${active ? ' now' : ''}`}>{idx + 1} · {ep.t}</div>
                {partWay ? (
                  <>
                    <div className="ep-prog"><div className="ep-prog-fill" style={{width:`${pct}%`}}/></div>
                    <div className={`ep-sub${active ? ' now' : ''}`}>{active && isPlaying ? t.nowPlaying : t.minLeft(leftOf(ep))}</div>
                  </>
                ) : finished ? (
                  <div className={`ep-sub done${active ? ' now' : ''}`}><IcoCheck s={14}/>{active && isPlaying ? t.nowPlaying : `${t.finished} · ${fmtDur(ep.d)}`}</div>
                ) : (
                  <div className={`ep-sub${active ? ' now' : ''}`}>{active ? t.nowPlaying : fmtDur(ep.d)}</div>
                )}
              </div>
              <button className={`ep-save-btn${savedEp ? ' saved' : ''}`} aria-label={savedEp ? 'Remove from saved' : 'Save talk'}
                onClick={e => { e.stopPropagation(); onToggleSaveEpisode(series, ep); }}>
                <IcoHeart s={22} filled={savedEp}/>
              </button>
            </div>
          );
        })}
      </div>
      <div style={{height:24}}/>
    </div>
  );
}

/* Some catalogue descriptions were cut mid-word at 200 characters; end them at the last full sentence or word instead. */
const tidy = x => {
  const s = String(x).trim();
  if (/[.!?…"”]$/.test(s) || s.length < 180) return s;
  const cut = s.lastIndexOf('. ');
  if (cut > 80) return s.slice(0, cut + 1);
  return s.slice(0, s.lastIndexOf(' ')) + '…';
};
const secsOf = d => { const p = String(d || '0:00').split(':').map(Number); return p.length === 3 ? p[0]*3600 + p[1]*60 + p[2] : p[0]*60 + p[1]; };
