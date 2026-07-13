import { useState } from 'react';
import { IcoBack, IcoHeart, IcoSearch, Wave } from './Icons.jsx';
import { SeriesImg } from './SeriesImg.jsx';

/* ── Series Detail ── */
export function SeriesScreen({series, onBack, onEpisode, currentEp, savedEpisodeUrls, onToggleSaveEpisode, t}) {
  const [epQ, setEpQ] = useState('');
  const episodes = series.e;
  const filtered = epQ ? episodes.filter(e => e.t.toLowerCase().includes(epQ.toLowerCase())) : episodes;

  return (
    <div>
      <div className="back-bar">
        <button className="back-btn" onClick={onBack}><IcoBack/>{t.back}</button>
      </div>
      <div className="series-hero">
        <div className="hero-art">
          <SeriesImg series={series} style={{width:160,height:160,borderRadius:22,overflow:'hidden'}} className=""/>
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
            <div key={ep.u} className="ep-row" onClick={() => onEpisode(ep)}>
              <div className="ep-num" style={{color:active?'var(--accent)':undefined}}>
                {active ? <Wave/> : (idx + 1)}
              </div>
              <div className="ep-info">
                <div className={`ep-name${active?' now':''}`}>{ep.t}</div>
              </div>
              <div className="ep-dur">{ep.d}</div>
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
