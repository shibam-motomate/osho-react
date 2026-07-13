import { IcoBack, IcoPlay, IcoX } from './Icons.jsx';

const timeAgo = ts => {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

/* ── Listening history (recent plays, reached from the My Profile menu) ── */
export function HistoryScreen({onBack, history, onPlayEntry, onRemove, onClearAll}) {
  return (
    <div>
      <div className="back-bar">
        <button className="back-btn" onClick={onBack}><IcoBack/>Home</button>
      </div>
      <div className="page-h1-row">
        <h1 className="page-h1">History</h1>
        {history.length > 0 && <button className="clear-all-btn" onClick={onClearAll}>Clear All</button>}
      </div>
      <div className="ep-list">
        {history.length === 0 ? (
          <div className="empty-state">Nothing played yet — your recent episodes will show up here.</div>
        ) : history.map(h => (
          <div key={h.episodeUrl + h.playedAt} className="ep-row" onClick={() => onPlayEntry(h)}>
            <div className="ep-num"><IcoPlay s={14}/></div>
            <div className="ep-info">
              <div className="ep-name">{h.episodeTitle}</div>
              <div style={{fontSize:11.5,color:'var(--muted)',marginTop:2}}>{h.seriesName}</div>
            </div>
            <div className="ep-dur">{timeAgo(h.playedAt)}</div>
            <button className="ep-save-btn" aria-label="Remove from history"
              onClick={ev => { ev.stopPropagation(); onRemove(h.episodeUrl); }}>
              <IcoX/>
            </button>
          </div>
        ))}
      </div>
      <div style={{height:24}}/>
    </div>
  );
}
