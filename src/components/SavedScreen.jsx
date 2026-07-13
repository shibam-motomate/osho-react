import { useMemo } from 'react';
import { IcoBack } from './Icons.jsx';
import { SeriesCard } from './SeriesCard.jsx';

/* ── Saved series (full grid, reached from the My Profile menu) ── */
export function SavedScreen({onBack, seriesList, savedSeries, onToggleSave, onSeries, discLang, t}) {
  const saved = useMemo(() => seriesList.filter(s => savedSeries.has(s.i)), [seriesList, savedSeries]);

  return (
    <div>
      <div className="back-bar">
        <button className="back-btn" onClick={onBack}><IcoBack/>Profile</button>
      </div>
      <div className="sec-lbl" style={{paddingTop:20}}>Saved Series</div>
      <div className="series-grid">
        {saved.length === 0 ? (
          <div className="empty-state">No saved series yet — tap the heart on any series to save it here.</div>
        ) : saved.map(s => (
          <SeriesCard key={s.i} s={s} discLang={discLang} saved onOpen={onSeries} onToggleSave={onToggleSave} t={t}/>
        ))}
      </div>
      <div style={{height:24}}/>
    </div>
  );
}
