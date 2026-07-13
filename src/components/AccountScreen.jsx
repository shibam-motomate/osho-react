import { useMemo } from 'react';
import { IcoBack, IcoLogOut, IcoPlay, IcoX } from './Icons.jsx';
import { SeriesCard } from './SeriesCard.jsx';
import { SeriesImg } from './SeriesImg.jsx';

/* ── My Account: profile, continue listening, saved series ── */
export function AccountScreen({user, onBack, onSignOut, seriesList, savedSeries, onToggleSave, onSeries, discLang, nowPlaying, audioPct, onResume, onDismissCL, t}) {
  const saved = useMemo(() => seriesList.filter(s => savedSeries.has(s.i)), [seriesList, savedSeries]);
  const initial = (user?.email || '?')[0].toUpperCase();

  return (
    <div>
      <div className="back-bar">
        <button className="back-btn" onClick={onBack}><IcoBack/>Home</button>
      </div>

      <div className="acc-profile">
        <div className="acc-avatar">{initial}</div>
        <div className="acc-email">{user?.email}</div>
        <button className="acc-logout" onClick={onSignOut}><IcoLogOut s={14}/>Log Out</button>
      </div>

      {nowPlaying && (
        <div style={{marginBottom:4}}>
          <div className="sec-lbl">{t.continueListening}</div>
          <div className="cl-card" onClick={onResume}>
            <SeriesImg series={nowPlaying.series} className="cl-art" style={{width:60,height:60,borderRadius:12,border:'1px solid var(--border)',overflow:'hidden',flexShrink:0}}/>
            <div className="cl-info">
              <div className="cl-title-row">
                <span className="cl-title">{nowPlaying.series.n}</span>
                <span className="cl-pct-pill">{Math.round(audioPct)}% listened</span>
              </div>
              <div className="cl-ep">{nowPlaying.episode.t}</div>
              <div className="cl-prog"><div className="cl-prog-fill" style={{width:`${audioPct}%`}}/></div>
            </div>
            <div className="cl-actions">
              <button className="cl-play" onClick={e => { e.stopPropagation(); onResume(); }}><IcoPlay s={16}/></button>
              <button className="cl-close" onClick={e => { e.stopPropagation(); onDismissCL(); }}><IcoX/></button>
            </div>
          </div>
        </div>
      )}

      <div className="sec-lbl">Favorites</div>
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
