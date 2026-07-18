import { useMemo, useState } from 'react';
import { isVideoId } from '../config.js';
import { onActivateKey } from '../lib/a11y.js';
import { BookCard } from './BookCard.jsx';
import { IcoBack, IcoHeart } from './Icons.jsx';
import { SeriesCard } from './SeriesCard.jsx';

/* ── Saved: whole series/videos, individual episodes, and books — reached from the My Profile menu ── */
export function SavedScreen({onBack, discourseSeries, videoSeries, books, savedSeries, onToggleSave, savedEpisodes, onToggleSaveEpisode, onPlayEpisode, savedBooks, onToggleSaveBook, onReadBook, onSeries, t}) {
  const [ct, setCt] = useState('discourses'); // 'discourses' | 'videos' | 'books'
  const [tab, setTab] = useState('series'); // 'series' | 'episodes'

  const poolSeries = ct === 'videos' ? videoSeries : discourseSeries;
  const saved = useMemo(() => poolSeries.filter(s => savedSeries.has(s.i)), [poolSeries, savedSeries]);
  const savedEps = useMemo(() => savedEpisodes.filter(e => isVideoId(e.seriesId) === (ct === 'videos')), [savedEpisodes, ct]);
  const savedBookList = useMemo(() => books.filter(b => savedBooks.has(b.i)), [books, savedBooks]);
  const count = ct === 'books' ? savedBookList.length : tab === 'episodes' ? savedEps.length : saved.length;
  const countLabel = ct === 'books' ? `${count} book${count===1?'':'s'}` : tab === 'episodes' ? `${count} discourse${count===1?'':'s'}` : `${count} series`;

  return (
    <div>
      <div className="back-bar">
        <button className="back-btn" onClick={onBack}><IcoBack/>Home</button>
      </div>
      <div className="page-card-wrap">
        <div className="page-card">
      <div style={{padding:'18px 4px 2px'}}>
        <div className="page-eyebrow">Your Library</div>
        <div className="page-card-heading">
          <h1>Saved</h1>
          <span className="page-card-count">{countLabel}</span>
        </div>
      </div>
      {/* Books tab hidden for now — see Header.jsx */}
      <div className="ct-tabs" style={{margin:'16px 4px 4px'}}>
        <button className={`ct-tab-btn${ct==='discourses'?' active':''}`} onClick={() => setCt('discourses')}>{t.discoursesTab}</button>
        <button className={`ct-tab-btn${ct==='videos'?' active':''}`} onClick={() => setCt('videos')}>{t.videosTab}</button>
      </div>

      {ct === 'books' ? (
        <div className="series-grid book-grid">
          {savedBookList.length === 0 ? (
            <div className="empty-state">{t.savedBooksEmpty}</div>
          ) : savedBookList.map(b => (
            <BookCard key={b.i} b={b} saved onToggleSave={onToggleSaveBook} onRead={onReadBook}/>
          ))}
        </div>
      ) : (
        <>
          <div className="saved-tabs">
            <button className={`saved-tab-btn${tab==='series'?' active':''}`} onClick={() => setTab('series')}>Whole Series</button>
            <button className={`saved-tab-btn${tab==='episodes'?' active':''}`} onClick={() => setTab('episodes')}>Individual Discourses</button>
          </div>

          {tab === 'series' ? (
            <div className="series-grid">
              {saved.length === 0 ? (
                <div className="empty-state">No saved series yet — tap the heart on any series to save it here.</div>
              ) : saved.map(s => (
                <SeriesCard key={s.i} s={s} discLang={s._lang} saved onOpen={onSeries} onToggleSave={onToggleSave} t={t}/>
              ))}
            </div>
          ) : (
            <div className="ep-list">
              {savedEps.length === 0 ? (
                <div className="empty-state">No saved discourses yet — tap the heart next to any episode to save it here.</div>
              ) : savedEps.map(e => (
                <div key={e.episodeUrl} className="ep-row" onClick={() => onPlayEpisode(e)}
                  role="button" tabIndex={0} onKeyDown={onActivateKey(() => onPlayEpisode(e))}>
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
        </>
      )}
        </div>
      </div>
    </div>
  );
}
