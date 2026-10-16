import { useMemo } from 'react';
import { EPISODE_COUNTS, GENRE_LIST } from '../config.js';
import { OSHO_VIDEOS_EN, OSHO_VIDEOS_HI } from '../data/oshoVideos.js';
import { onActivateKey } from '../lib/a11y.js';
import { IcoBook, IcoClock, IcoLogOut, IcoUser } from './Icons.jsx';

const VIDEO_EPISODE_COUNTS = {
  en: OSHO_VIDEOS_EN.reduce((a, s) => a + s.e.length, 0),
  hi: OSHO_VIDEOS_HI.reduce((a, s) => a + s.e.length, 0),
};

/* ── Desktop sidebar: Browse (language + topics with counts) or Profile (Account / Saved / History) ── */
export function Sidebar({mode, screen, discLang, setDiscLang, activePill, setActivePill, t, seriesList, contentType, user, onSignOut, onOpenAccount, onOpenSaved, onOpenHistory}) {
  const isVideos = contentType === 'videos';

  const genres = useMemo(() => {
    const counts = {};
    seriesList.forEach(s => { counts[s.g] = (counts[s.g] || 0) + 1; });
    return GENRE_LIST.filter(g => g === 'all' || counts[g]).map(g => ({g, n: g === 'all' ? seriesList.length : counts[g]}));
  }, [seriesList]);

  const langCounts = isVideos ? VIDEO_EPISODE_COUNTS : EPISODE_COUNTS;

  return (
    <aside className="sb">
      {mode === 'profile' ? (
        <>
          <div className="sb-nav">
            <button className={`sb-nav-item${screen==='account'?' active':''}`} onClick={onOpenAccount}><IcoUser s={20}/><span>{t.accountTab}</span></button>
            <button className={`sb-nav-item${screen==='saved'?' active':''}`} onClick={onOpenSaved}><IcoBook s={20}/><span>{t.savedTab}</span></button>
            <button className={`sb-nav-item${screen==='history'?' active':''}`} onClick={onOpenHistory}><IcoClock s={20}/><span>{t.historyTab}</span></button>
          </div>
          {user && (
            <div className="sb-foot">
              <button className="sb-logout-full" onClick={onSignOut}><IcoLogOut s={16}/><span>Log out</span></button>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="sb-sec">
            <div className="sb-lbl">{isVideos ? t.videosIn : t.discourseLang}</div>
            <div className="sb-disc" role="group" aria-label={t.discourseLang}>
              <button className={`sb-disc-btn ${discLang==='en'?'active':''}`} onClick={() => setDiscLang('en')}>{t.discEn} · {langCounts.en}</button>
              <button className={`sb-disc-btn ${discLang==='hi'?'active':''}`} onClick={() => setDiscLang('hi')}>{t.discHi} · {langCounts.hi}</button>
            </div>
          </div>
          <div className="sb-sec" style={{flex:1}}>
            <div className="sb-lbl">{t.topics}</div>
            <div className="sb-genres">
              {genres.map(({g, n}) => (
                <div key={g} className={`sb-genre-item ${activePill===g?'active':''}`} onClick={() => setActivePill(g)}
                  role="button" tabIndex={0} onKeyDown={onActivateKey(() => setActivePill(g))}>
                  <span>{g==='all' ? t.all : (t.genres[g] || g)}</span>
                  <span className="sb-genre-count">{n}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
