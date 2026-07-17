import { isVideoId, seriesTotalDuration } from '../config.js';
import { onActivateKey } from '../lib/a11y.js';
import { IcoHeart, IcoPlay } from './Icons.jsx';
import { SeriesImg } from './SeriesImg.jsx';

/* ── Series grid card (used on Home and Account screens) — video series get a
   YouTube-style 16:9 thumbnail with a play badge and duration chip. ── */
export function SeriesCard({s, discLang, saved, onOpen, onToggleSave, t}) {
  const isVideo = isVideoId(s.i);
  return (
    <div className={`series-card${isVideo?' video-card':''}`} onClick={() => onOpen(s)}
      role="button" tabIndex={0} onKeyDown={onActivateKey(() => onOpen(s))}>
      <div className="series-card-img-wrap">
        <SeriesImg series={s} className="series-card-img"/>
        {isVideo && <div className="video-play-badge"><IcoPlay s={20}/></div>}
        {isVideo && <span className="video-dur-badge">{seriesTotalDuration(s)}</span>}
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
          {!isVideo && <span className="stat-pill">{seriesTotalDuration(s)}</span>}
        </div>
      </div>
    </div>
  );
}
