import { useState } from 'react';
import { isVideoId } from '../config.js';
import { onActivateKey } from '../lib/a11y.js';
import { IcoBack, IcoHeart, IcoPlay, IcoSearch, Wave } from './Icons.jsx';
import { SeriesImg } from './SeriesImg.jsx';

/* ── Series Detail — video series get a 16:9 hero and YouTube-style thumbnail rows ── */
export function SeriesScreen({series, onBack, onEpisode, currentEp, savedEpisodeUrls, onToggleSaveEpisode, t}) {
  const [epQ, setEpQ] = useState('');
  const isVideo = isVideoId(series.i);
  const episodes = series.e;
  const filtered = epQ ? episodes.filter(e => e.t.toLowerCase().includes(epQ.toLowerCase())) : episodes;

  return (
    <div>
      <div className="back-bar">
        <button className="back-btn" onClick={onBack}><IcoBack/>{t.back}</button>
      </div>
      <div className="series-hero">
        <div className={`hero-art${isVideo?' hero-art-video':''}`}>
          <SeriesImg series={series} style={{width:'100%',height:'100%',borderRadius:22,overflow:'hidden'}} className=""/>
        </div>
        <div className="hero-info">
          <div className="hero-ttl">{series.n}</div>
          <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>
            <span className="stat-pill" style={{fontSize:12,padding:'4px 10px'}}>{t.genres[series.g] || series.g}</span>
            <span className="stat-pill" style={{fontSize:12,padding:'4px 10px'}}>{t.episodes(series.e.length)}</span>
          </div>
          {series.x && <div className="hero-desc">{series.x}</div>}
        </div>
      </div>
      <div className="ep-search">
        <div className="sbar">
          <span style={{color:'var(--muted)'}}><IcoSearch/></span>
          <input value={epQ} onChange={e => setEpQ(e.target.value)} placeholder={t.searchEp}/>
        </div>
      </div>
      <div className="ep-list">
        {filtered.map((ep, idx) => {
          const active = currentEp?.u === ep.u;
          const saved = savedEpisodeUrls.has(ep.u);
          return (
            <div key={ep.u} className={`ep-row${isVideo?' ep-row-video':''}`} onClick={() => onEpisode(ep)}
              role="button" tabIndex={0} onKeyDown={onActivateKey(() => onEpisode(ep))}>
              {isVideo ? (
                <div className="ep-thumb-wrap">
                  <SeriesImg series={series} img={ep.img} className="ep-thumb"/>
                  {active ? <div className="ep-thumb-playing"><Wave/></div> : <div className="ep-thumb-play"><IcoPlay s={16}/></div>}
                  <span className="ep-thumb-dur">{ep.d}</span>
                </div>
              ) : (
                <div className="ep-num" style={{color:active?'var(--accent)':undefined}}>
                  {active ? <Wave/> : (idx + 1)}
                </div>
              )}
              <div className="ep-info">
                <div className={`ep-name${active?' now':''}`}>{ep.t}</div>
              </div>
              {!isVideo && <div className="ep-dur">{ep.d}</div>}
              <button className={`ep-save-btn${saved?' saved':''}`} aria-label="Save discourse"
                onClick={e => { e.stopPropagation(); onToggleSaveEpisode(series, ep); }}>
                <IcoHeart s={14} filled={saved}/>
              </button>
            </div>
          );
        })}
      </div>
      <div style={{height:24}}/>
    </div>
  );
}
