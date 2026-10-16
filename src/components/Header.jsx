import { onActivateKey } from '../lib/a11y.js';
import { IcoBook, IcoSearch, IcoX } from './Icons.jsx';
import { ProfileMenu } from './ProfileMenu.jsx';

const CT_DEFS = [
  {key: 'discourses', labelKey: 'discoursesTab'},
  {key: 'videos', labelKey: 'videosTab'},
];

/* ── Desktop top bar. On phones the bar is hidden: the Home hero carries the wordmark,
   language toggle and search button, and sub-screens carry their own back bars. The
   phone search field lives in the Home hero and slides open to the left. ── */
export function Header({t, contentType, onSelectContentType, search, setSearch, discLang, setDiscLang, onOpenSaved, onLogoClick, user, onSelectBrowse, onSelectProfile, onSelectLogout}) {
  const searchPlaceholder = contentType === 'videos' ? t.searchVideos : t.search;

  return (
    <>
      <header className="global-header">
        <a className="gh-logo" href="/" onClick={e => { e.preventDefault(); onLogoClick(); }} aria-label="Osho — Home">
          <span className="wordmark caps">OSHO</span>
        </a>
        <nav className="gh-nav" aria-label="Content">
          {CT_DEFS.map(c => (
            <button key={c.key} className={`gh-nav-tab${contentType===c.key?' active':''}`} onClick={() => onSelectContentType(c.key)}>{t[c.labelKey]}</button>
          ))}
        </nav>
        <div className="gh-spacer"/>
        <label className="gh-search">
          <span style={{display:'flex',color:'var(--muted)'}}><IcoSearch s={18}/></span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={searchPlaceholder} aria-label={searchPlaceholder}/>
          {search && <button className="gh-search-clear" aria-label="Clear search" onClick={() => setSearch('')}><IcoX s={16}/></button>}
        </label>
        <div className="seg" role="group" aria-label={t.discourseLang}>
          <button className={`seg-btn${discLang==='en'?' active':''}`} onClick={() => setDiscLang('en')}>{t.discEn}</button>
          <button className={`seg-btn${discLang==='hi'?' active':''}`} onClick={() => setDiscLang('hi')}>{t.discHi}</button>
        </div>
        <div className="gh-icons">
          <button className="icon-btn" aria-label={t.savedTab} onClick={onOpenSaved}><IcoBook s={22}/></button>
          <ProfileMenu size={48} user={user} onSelectBrowse={onSelectBrowse} onSelectProfile={onSelectProfile} onSelectLogout={onSelectLogout}/>
        </div>
      </header>
    </>
  );
}
