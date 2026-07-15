import { useMemo } from 'react';
import { BOOK_FORMAT_COLORS, EPISODE_COUNTS, GENRE_COLORS, GENRE_LIST } from '../config.js';
import { OSHO_BOOKS } from '../data/oshoBooks.js';
import { OSHO_VIDEOS_EN, OSHO_VIDEOS_HI } from '../data/oshoVideos.js';
import { IcoClock, IcoHeart, IcoLogOut, IcoUser } from './Icons.jsx';

const VIDEO_EPISODE_COUNTS = {
  en: OSHO_VIDEOS_EN.reduce((a, s) => a + s.e.length, 0),
  hi: OSHO_VIDEOS_HI.reduce((a, s) => a + s.e.length, 0),
};

/* ── Sidebar: Browse (genre/language) or Profile (menu) panel ── */
export function Sidebar({mode, screen, onLogoClick, discLang, setDiscLang, activePill, setActivePill, t, seriesList, contentType, user, onSignOut, onOpenAccount, onOpenSaved, onOpenHistory}) {
  const isBooks = contentType === 'books';
  const isVideos = contentType === 'videos';

  const genres = useMemo(() => {
    const seen = new Set();
    seriesList.forEach(s => seen.add(s.g));
    return GENRE_LIST.filter(g => g === 'all' || seen.has(g));
  }, [seriesList]);

  const formats = useMemo(() => ['all', ...Array.from(new Set(OSHO_BOOKS.map(b => b.tag)))], []);

  const langCounts = isVideos ? VIDEO_EPISODE_COUNTS : EPISODE_COUNTS;

  return (
    <aside className="sb">
      <div className="sb-logo" onClick={onLogoClick} style={{cursor:'pointer'}}>
        <div className="wordmark">Osho<em>·</em></div>
        <div className="wordmark-sub">Discourses</div>
      </div>

      {mode === 'profile' ? (
        <>
          <div className="sb-nav">
            <button className={`sb-nav-item${screen==='account'?' active':''}`} onClick={onOpenAccount}><IcoUser s={17}/><span>Account</span></button>
            <button className={`sb-nav-item${screen==='saved'?' active':''}`} onClick={onOpenSaved}><IcoHeart s={17}/><span>Saved</span></button>
            <button className={`sb-nav-item${screen==='history'?' active':''}`} onClick={onOpenHistory}><IcoClock s={17}/><span>History</span></button>
          </div>
          <div style={{flex:1}}/>
          {user && (
            <div className="sb-foot">
              <button className="sb-logout-full" onClick={onSignOut}><IcoLogOut s={14}/><span>Log Out</span></button>
            </div>
          )}
        </>
      ) : isBooks ? (
        <div className="sb-sec" style={{flex:1}}>
          <div className="sb-lbl">{t.format}</div>
          <div className="sb-genres">
            {formats.map(f => {
              const c = BOOK_FORMAT_COLORS[f] || '#C0B8B0';
              return (
                <div key={f} className={`sb-genre-item ${activePill===f?'active':''}`} onClick={() => setActivePill(f)}>
                  <div className="sb-genre-dot" style={{background: f==='all' ? 'var(--muted)' : c}}/>
                  <span className="sb-genre-name">{f==='all' ? t.all : f}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <>
          <div className="sb-sec">
            <div className="sb-lbl">{isVideos ? t.videosIn : t.discourseLang}</div>
            <div className="sb-disc">
              <button className={`sb-disc-btn ${discLang==='en'?'active':''}`} onClick={() => setDiscLang('en')}>
                {t.discEn}<span style={{fontSize:10,opacity:0.7,marginLeft:4}}>· {langCounts.en}</span>
              </button>
              <button className={`sb-disc-btn ${discLang==='hi'?'active':''}`} onClick={() => setDiscLang('hi')}>
                {t.discHi}<span style={{fontSize:10,opacity:0.7,marginLeft:4}}>· {langCounts.hi}</span>
              </button>
            </div>
          </div>
          <div className="sb-sec" style={{flex:1}}>
            <div className="sb-lbl">{t.exploreTopic}</div>
            <div className="sb-genres">
              {genres.map(g => {
                const c = GENRE_COLORS[g] || '#C0B8B0';
                return (
                  <div key={g} className={`sb-genre-item ${activePill===g?'active':''}`} onClick={() => setActivePill(g)}>
                    <div className="sb-genre-dot" style={{background: g==='all' ? 'var(--muted)' : c}}/>
                    <span className="sb-genre-name">{g==='all' ? t.all : (t.genres[g] || g)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
