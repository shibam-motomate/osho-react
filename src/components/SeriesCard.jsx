import { isVideoId, seriesTotalDuration } from '../config.js';
import { onActivateKey } from '../lib/a11y.js';
import { IcoChevronRight, IcoHeart } from './Icons.jsx';
import { SeriesImg } from './SeriesImg.jsx';

/* ── Series list row (Home, Saved). One series per row: artwork, name, meta, save, chevron.
   Lists scan better than grids for older eyes; every row is a 96 px target. ── */
export function SeriesCard({s, discLang, saved, onOpen, onToggleSave, t}) {
  const isVideo = isVideoId(s.i);
  const genre = t.genres[s.g] || s.g;
  const meta = [genre, t.talks(s.e.length), seriesTotalDuration(s).replace(/ \d+m$/, m => m)].join(' · ');
  return (
    <div className="srow" onClick={() => onOpen(s)} role="button" tabIndex={0} onKeyDown={onActivateKey(() => onOpen(s))}>
      <SeriesImg series={s} className={`srow-art${isVideo ? ' video' : ''}`}/>
      <div className="srow-info">
        <div className="srow-title">{s.n}</div>
        <div className="srow-meta">{meta}</div>
      </div>
      {onToggleSave && (
        <button className={`srow-save${saved ? ' saved' : ''}`} aria-label={saved ? 'Remove from saved' : 'Save series'}
          onClick={e => { e.stopPropagation(); onToggleSave(s.i); }}>
          <IcoHeart s={22} filled={saved}/>
        </button>
      )}
      <span className="srow-chev" aria-hidden="true"><IcoChevronRight/></span>
    </div>
  );
}
