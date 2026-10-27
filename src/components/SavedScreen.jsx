import { useMemo, useState } from 'react';
import { isVideoId } from '../config.js';
import { onActivateKey } from '../lib/a11y.js';
import { IcoHeart, IcoPlay, IcoX } from './Icons.jsx';
import { SegSlider } from './SegSlider.jsx';
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

/* ── Library: a tab of its own (bottom bar on phones, sidebar on desktop), so no back button.
   A sliding three-way switch (Recent · Series · Talks, each with its count) picks the one list shown;
   a short hint under it says what the list is, with Clear for recent plays. ── */
export function SavedScreen({discourseSeries, videoSeries, savedSeries, onToggleSave, savedEpisodes, onToggleSaveEpisode, onPlayEpisode, onSeries,
  history = [], onRemoveHistory, onClearHistory, t}) {
  const [tab, setTab] = useState('recent'); // 'recent' | 'series' | 'talks'
  const saved = useMemo(() => [...discourseSeries, ...videoSeries].filter(s => savedSeries.has(s.i)), [discourseSeries, videoSeries, savedSeries]);

  const tabs = [
    {key: 'recent', label: 'Recent', count: history.length},
    {key: 'series', label: 'Series', count: saved.length},
    {key: 'talks',  label: 'Talks',  count: savedEpisodes.length},
  ];

  return (
    <div>
      <div className="page-card-wrap lib-wrap">
        <h1 className="set-title">{t.savedTab}</h1>

        <SegSlider label={t.savedTab} value={tab} onChange={setTab}
          options={tabs.map(tb => ({value: tb.key, aria: `${tb.label}, ${tb.count}`,
            label: <>{tb.label}<span className="segs-count">{tb.count}</span></>}))}/>

        {tab === 'recent' && (
          <>
            <div className="lib-bar">
              <span>Talks you listened to lately</span>
              {history.length > 0 && <button className="lib-clear" onClick={onClearHistory}>{t.clearHistory}</button>}
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
            <div className="lib-bar"><span>Series you kept with the heart button</span></div>
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
            <div className="lib-bar"><span>Single talks you kept with the heart button</span></div>
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
