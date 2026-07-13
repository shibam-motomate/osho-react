import { useMemo, useState } from 'react';
import { IcoBack, IcoHeart } from './Icons.jsx';
import { SeriesCard } from './SeriesCard.jsx';

/* ── Saved: whole series and individual discourses, reached from the My Profile menu ── */
export function SavedScreen({onBack, seriesList, savedSeries, onToggleSave, savedEpisodes, onToggleSaveEpisode, onPlayEpisode, onSeries, discLang, t}) {
  const [tab, setTab] = useState('series'); // 'series' | 'episodes'
  const saved = useMemo(() => seriesList.filter(s => savedSeries.has(s.i)), [seriesList, savedSeries]);

  return (
    <div>
      <div className="back-bar">
        <button className="back-btn" onClick={onBack}><IcoBack/>Profile</button>
      </div>
      <div className="saved-tabs">
        <button className={`saved-tab-btn${tab==='series'?' active':''}`} onClick={() => setTab('series')}>Whole Series</button>
        <button className={`saved-tab-btn${tab==='episodes'?' active':''}`} onClick={() => setTab('episodes')}>Individual Discourses</button>
      </div>

      {tab === 'series' ? (
        <div className="series-grid">
          {saved.length === 0 ? (
            <div className="empty-state">No saved series yet — tap the heart on any series to save it here.</div>
          ) : saved.map(s => (
            <SeriesCard key={s.i} s={s} discLang={discLang} saved onOpen={onSeries} onToggleSave={onToggleSave} t={t}/>
          ))}
        </div>
      ) : (
        <div className="ep-list">
          {savedEpisodes.length === 0 ? (
            <div className="empty-state">No saved discourses yet — tap the heart next to any episode to save it here.</div>
          ) : savedEpisodes.map(e => (
            <div key={e.episodeUrl} className="ep-row" onClick={() => onPlayEpisode(e)}>
              <div className="ep-info">
                <div className="ep-name">{e.episodeTitle}</div>
                <div style={{fontSize:11.5,color:'var(--muted)',marginTop:2}}>{e.seriesName}</div>
              </div>
              <div className="ep-dur">{e.duration}</div>
              <button className="ep-save-btn saved" aria-label="Remove"
                onClick={ev => { ev.stopPropagation(); onToggleSaveEpisode({i: e.seriesId, n: e.seriesName}, {u: e.episodeUrl, t: e.episodeTitle, d: e.duration}); }}>
                <IcoHeart s={14} filled/>
              </button>
            </div>
          ))}
        </div>
      )}
      <div style={{height:24}}/>
    </div>
  );
}
