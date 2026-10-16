import { useMemo, useState } from 'react';
import { isVideoId } from '../config.js';
import { onActivateKey } from '../lib/a11y.js';
import { IcoBack, IcoPlay, IcoX } from './Icons.jsx';

const timeAgo = ts => {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? 'Yesterday' : `${days} days ago`;
};

/* ── History: recently played talks ── */
export function HistoryScreen({onBack, history, onPlayEntry, onRemove, onClearAll, t}) {
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'discourses' | 'videos'

  const filtered = useMemo(() => {
    if (typeFilter === 'all') return history;
    return history.filter(h => isVideoId(h.seriesId) === (typeFilter === 'videos'));
  }, [history, typeFilter]);

  return (
    <div>
      <div className="back-bar">
        <button className="back-btn" onClick={onBack}><IcoBack/>{t.home}</button>
        {history.length > 0 && <button className="clear-all-pill" onClick={onClearAll}>Clear all</button>}
      </div>
      <div className="page-card-wrap">
        <div className="page-card-title-row">
          <div>
            <div className="page-eyebrow">{t.library}</div>
            <div className="page-card-heading">
              <h1>{t.historyTab}</h1>
              <span className="page-card-count">{t.talks(filtered.length)}</span>
            </div>
          </div>
        </div>
        <div className="ct-tabs">
          <button className={`ct-tab-btn${typeFilter==='all'?' active':''}`} onClick={() => setTypeFilter('all')}>{t.all}</button>
          <button className={`ct-tab-btn${typeFilter==='discourses'?' active':''}`} onClick={() => setTypeFilter('discourses')}>{t.discoursesTab}</button>
          <button className={`ct-tab-btn${typeFilter==='videos'?' active':''}`} onClick={() => setTypeFilter('videos')}>{t.videosTab}</button>
        </div>
        <div className="ep-list">
          {filtered.length === 0 ? (
            <div className="empty-state">Nothing played yet. Talks you listen to will show up here.</div>
          ) : filtered.map(h => (
            <div key={h.episodeUrl + h.playedAt} className="ep-row" onClick={() => onPlayEntry(h)}
              role="button" tabIndex={0} onKeyDown={onActivateKey(() => onPlayEntry(h))}>
              <span className="ep-play" aria-hidden="true"><IcoPlay s={24}/></span>
              <div className="ep-info">
                <div className="ep-name">{h.episodeTitle}</div>
                <div className="ep-sub">{h.seriesName} · {timeAgo(h.playedAt)}</div>
              </div>
              <button className="ep-save-btn" aria-label="Remove from history" onClick={ev => { ev.stopPropagation(); onRemove(h.episodeUrl); }}>
                <IcoX s={20}/>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
