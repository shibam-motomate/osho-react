import { useMemo } from 'react';
import { EPISODE_COUNTS, GENRE_COLORS, GENRE_LIST, LANGS } from '../config.js';
import { IcoClock, IcoHeart, IcoLogOut } from './Icons.jsx';

/* ── Sidebar: Browse (genre/language) or Profile (account) panel ── */
export function Sidebar({mode, onLogoClick, discLang, setDiscLang, activePill, setActivePill, t, seriesList, user, lang, setLang, onSignOut, onOpenSaved, onOpenHistory}) {
  const genres = useMemo(() => {
    const seen = new Set();
    seriesList.forEach(s => seen.add(s.g));
    return GENRE_LIST.filter(g => g === 'all' || seen.has(g));
  }, [seriesList]);

  return (
    <aside className="sb">
      <div className="sb-logo" onClick={onLogoClick} style={{cursor:'pointer'}}>
        <div className="wordmark">Osho<em>·</em></div>
        <div className="wordmark-sub">Discourses</div>
      </div>

      {mode === 'profile' ? (
        <>
          <div className="sb-sec">
            {user ? (
              <div className="sb-profile-id">
                <div className="acc-avatar" style={{width:38,height:38,fontSize:15}}>{user.email[0].toUpperCase()}</div>
                <div className="sb-profile-email">{user.email}</div>
              </div>
            ) : (
              <div className="sb-lbl">Not logged in</div>
            )}
          </div>
          <div className="sb-sec">
            <div className="sb-lbl">UI Language</div>
            <div className="sb-disc">
              {Object.entries(LANGS).map(([k, v]) => (
                <button key={k} className={`sb-disc-btn ${lang===k?'active':''}`} onClick={() => setLang(k)}>{v}</button>
              ))}
            </div>
          </div>
          <div className="sb-nav">
            <button className="sb-nav-item" onClick={onOpenSaved}><IcoHeart s={17}/><span>Saved</span></button>
            <button className="sb-nav-item" onClick={onOpenHistory}><IcoClock s={17}/><span>History</span></button>
          </div>
          <div style={{flex:1}}/>
          {user && (
            <div className="sb-foot">
              <button className="sb-logout-full" onClick={onSignOut}><IcoLogOut s={14}/><span>Log Out</span></button>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="sb-sec">
            <div className="sb-lbl">{t.discourseLang}</div>
            <div className="sb-disc">
              <button className={`sb-disc-btn ${discLang==='en'?'active':''}`} onClick={() => setDiscLang('en')}>
                {t.discEn}<span style={{fontSize:10,opacity:0.7,marginLeft:4}}>· {EPISODE_COUNTS.en}</span>
              </button>
              <button className={`sb-disc-btn ${discLang==='hi'?'active':''}`} onClick={() => setDiscLang('hi')}>
                {t.discHi}<span style={{fontSize:10,opacity:0.7,marginLeft:4}}>· {EPISODE_COUNTS.hi}</span>
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
