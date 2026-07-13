import { seriesTotalDuration } from '../config.js';
import { IcoHeart } from './Icons.jsx';
import { SeriesImg } from './SeriesImg.jsx';

/* ── Series grid card (used on Home and Account screens) ── */
export function SeriesCard({s, discLang, saved, onOpen, onToggleSave, t}) {
  return (
    <div className="series-card" onClick={() => onOpen(s)}>
      <div className="series-card-img-wrap">
        <SeriesImg series={s} className="series-card-img"/>
        <button className={`save-btn${saved?' saved':''}`} aria-label="Save series"
          onClick={e => { e.stopPropagation(); onToggleSave(s.i); }}>
          <IcoHeart s={15} filled={saved}/>
        </button>
      </div>
      <div className="series-card-info">
        <div className="series-title">{s.n}</div>
        <div className="series-meta">{t.genres[s.g] || s.g}</div>
        {s.x && <div className="series-desc">{s.x}</div>}
        <div className="series-stats">
          <span className="stat-pill lang">{discLang === 'hi' ? 'Hindi' : 'English'}</span>
          <span className="stat-pill">{t.episodes(s.e.length)}</span>
          <span className="stat-pill">{seriesTotalDuration(s)}</span>
        </div>
      </div>
    </div>
  );
}
