import { useMemo, useState } from 'react';
import { isVideoId } from '../config.js';
import { onActivateKey } from '../lib/a11y.js';
import { IcoBack, IcoHeadphones, IcoHeart, IcoHistory, IcoPlay, IcoPlaylist, IcoX } from './Icons.jsx';
import { SeriesCard } from './SeriesCard.jsx';
import { fmtDur } from './SeriesScreen.jsx';

const timeAgo = ts => {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? 'Yesterday' : `${days} days ago`;
};

/* ── Library: one three-way switch at the top (Recent · Series · Talks), one section shown at a time. ── */
export function SavedScreen({onBack, discourseSeries, videoSeries, savedSeries, onToggleSave, savedEpisodes, onToggleSaveEpisode, onPlayEpisode, onSeries,
  history = [], onRemoveHistory, onClearHistory, t}) {
  const [tab, setTab] = useState('recent'); // 'recent' | 'series' | 'talks'
  const saved = useMemo(() => [...discourseSeries, ...videoSeries].filter(s => savedSeries.has(s.i)), [discourseSeries, videoSeries, savedSeries]);

  const tabs = [
    {key: 'recent', label: 'Recent', icon: <IcoHistory s={22}/>, count: history.length},
    {key: 'series', label: 'Series', icon: <IcoPlaylist s={22}/>, count: saved.length},
    {key: 'talks',  label: 'Talks',  icon: <IcoHeadphones s={22}/>, count: savedEpisodes.length},
  ];

  return (
    <div>
      <div className="back-bar">
        <button className="back-btn" onClick={onBack}><IcoBack/>{t.home}</button>
      </div>
      <div className="page-card-wrap">
        <div className="page-card-title-row">
          <div>
            <div className="page-card-heading"><h1>{t.savedTab}</h1></div>
          </div>
        </div>

        <div className="lib-seg" role="tablist" aria-label={t.savedTab}>
          {tabs.map(tb => (
            <button key={tb.key} role="tab" aria-selected={tab === tb.key} className={`lib-seg-btn${tab === tb.key ? ' active' : ''}`} onClick={() => setTab(tb.key)}>
              <span className="lib-seg-ic">{tb.icon}</span>
              <span className="lib-seg-lbl">{tb.label}</span>
              <span className="lib-seg-count">{tb.count}</span>
            </button>
          ))}
        </div>

        {tab === 'recent' && (
          <>
            <div className="saved-sec">
              <div>
                <div className="saved-sec-title">{t.recentlyPlayed}</div>
                <div className="saved-sec-hint">Talks you listened to lately</div>
              </div>
              {history.length > 0 && <button className="clear-all-pill" onClick={onClearHistory}>{t.clearHistory}</button>}
            </div>
            {history.length === 0 ? (
              <div className="empty-state">Nothing played yet. Talks you listen to will show up here.</div>
            ) : (
              <div className="ep-list">
                {history.map(h => (
                  <div key={h.episodeUrl + h.playedAt} className="ep-row" onClick={() => onPlayEpisode(h)}
                    role="button" tabIndex={0} onKeyDown={onActivateKey(() => onPlayEpisode(h))}>
                    <span className="ep-play" aria-hidden="true"><IcoPlay s={24}/></span>
                    <div className="ep-info">
                      <div className="ep-name">{h.episodeTitle}</div>
                      <div className="ep-sub">{h.seriesName} · {timeAgo(h.playedAt)}</div>
                    </div>
                    <button className="ep-save-btn" aria-label="Remove from recently played" onClick={ev => { ev.stopPropagation(); onRemoveHistory(h.episodeUrl); }}>
                      <IcoX s={20}/>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'series' && (
          <>
            <div className="saved-sec">
              <div>
                <div className="saved-sec-title">Saved series</div>
                <div className="saved-sec-hint">Series you kept with the heart button</div>
              </div>
            </div>
            {saved.length === 0 ? (
              <div className="empty-state">No saved series yet. Tap the heart on any series to keep it here.</div>
            ) : (
              <div className="slist">
                {saved.map(s => (
                  <SeriesCard key={s.i} s={s} discLang={s._lang} saved onOpen={onSeries} onToggleSave={onToggleSave} t={t}/>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'talks' && (
          <>
            <div className="saved-sec">
              <div>
                <div className="saved-sec-title">Saved talks</div>
                <div className="saved-sec-hint">Single talks you kept with the heart button</div>
              </div>
            </div>
            {savedEpisodes.length === 0 ? (
              <div className="empty-state">No saved talks yet. Tap the heart next to any talk to keep it here.</div>
            ) : (
              <div className="ep-list">
                {savedEpisodes.map(e => (
                  <div key={e.episodeUrl} className="ep-row" onClick={() => onPlayEpisode(e)}
                    role="button" tabIndex={0} onKeyDown={onActivateKey(() => onPlayEpisode(e))}>
                    <span className="ep-play" aria-hidden="true"><IcoPlay s={24}/></span>
                    <div className="ep-info">
                      <div className="ep-name">{e.episodeTitle}</div>
                      <div className="ep-sub">{e.seriesName} · {fmtDur(e.duration)}{isVideoId(e.seriesId) ? ' · Video' : ''}</div>
                    </div>
                    <button className="ep-save-btn saved" aria-label="Remove from saved"
                      onClick={ev => { ev.stopPropagation(); onToggleSaveEpisode({i: e.seriesId, n: e.seriesName}, {u: e.episodeUrl, t: e.episodeTitle, d: e.duration}); }}>
                      <IcoHeart s={22} filled/>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
