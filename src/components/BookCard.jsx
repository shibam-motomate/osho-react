import { useState } from 'react';
import { BOOK_FORMAT_COLORS } from '../config.js';
import { IcoHeart } from './Icons.jsx';

/* ── Book grid card — expands in place to show description + Read action ── */
export function BookCard({b, saved, onToggleSave, onRead}) {
  const [open, setOpen] = useState(false);
  const tagColor = BOOK_FORMAT_COLORS[b.tag] || '#C0B8B0';

  return (
    <div className={`series-card book-card${open?' expanded':''}`} onClick={() => setOpen(v => !v)}>
      <div className="series-card-img-wrap book-cover" style={{background:b.color}}>
        <svg width="40%" viewBox="0 0 24 24" fill="none" stroke="rgba(32,19,23,0.35)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18.5A2.5 2.5 0 0 1 17.5 23H6.5A2.5 2.5 0 0 1 4 20.5v-16Z"/>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        </svg>
        <button className={`save-btn${saved?' saved':''}`} aria-label="Save book"
          onClick={e => { e.stopPropagation(); onToggleSave(b.i); }}>
          <IcoHeart s={15} filled={saved}/>
        </button>
      </div>
      <div className="series-card-info">
        <div className="series-title">{b.n}</div>
        <div className="series-meta">{b.author}</div>
        {open && b.x && <div className="series-desc book-desc">{b.x}</div>}
        <div className="series-stats">
          <span className="stat-pill lang" style={{color:tagColor,background:'var(--icon-surface)'}}>{b.tag}</span>
        </div>
        {open && (
          <>
            <button className="book-read-btn" onClick={e => { e.stopPropagation(); onRead(b); }}>
              {b.archiveId ? 'Read on Internet Archive ↗' : 'Read'}
            </button>
            {b.archiveId && <div className="book-read-note">Free library loan via archive.org — sign in there to borrow it.</div>}
          </>
        )}
      </div>
    </div>
  );
}
