import { onActivateKey } from '../lib/a11y.js';
import { IcoHeart, IcoSearch, IcoShare, IcoX } from './Icons.jsx';
import { ProfileMenu } from './ProfileMenu.jsx';

// Books is temporarily hidden from the UI — see also MobileNav.jsx and
// App.jsx's routing (the /books route redirects to Discourses).
const CT_DEFS = [
  {key: 'discourses', labelKey: 'discoursesTab'},
  {key: 'videos', labelKey: 'videosTab'},
];

/* ── Global maroon header: persistent across every screen, both layouts ── */
export function Header({t, contentType, onSelectContentType, search, setSearch, discLang, setDiscLang, onShareApp, onOpenSaved, onLogoClick, user, onSelectBrowse, onSelectProfile, onSelectLogout, mobSearchOpen, onToggleMobSearch}) {
  const searchPlaceholder = contentType === 'books' ? t.searchBooks : contentType === 'videos' ? t.searchVideos : t.search;

  return (
    <>
      <div className="global-header">
        <div className="gh-logo" onClick={onLogoClick} role="button" tabIndex={0} onKeyDown={onActivateKey(onLogoClick)} aria-label="Osho — Home">
          <img src="/osho-signature.webp" alt="Osho" className="gh-logo-img"/>
        </div>
        <div className="gh-spacer"/>
        <nav className="gh-nav">
          {CT_DEFS.map(c => (
            <button key={c.key} className={`gh-nav-tab${contentType===c.key?' active':''}`} onClick={() => onSelectContentType(c.key)}>{t[c.labelKey]}</button>
          ))}
        </nav>
        <div className="gh-search">
          <span style={{display:'flex'}}><IcoSearch/></span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={searchPlaceholder}/>
          {search && <button className="gh-search-clear" onClick={() => setSearch('')}><IcoX/></button>}
        </div>
        <div className="gh-icons">
          {contentType !== 'books' && (
            <div className="gh-lang">
              <button className={`gh-lang-btn${discLang==='en'?' active':''}`} onClick={() => setDiscLang('en')}>{t.discEn}</button>
              <button className={`gh-lang-btn${discLang==='hi'?' active':''}`} onClick={() => setDiscLang('hi')}>{t.discHi}</button>
            </div>
          )}
          <button className="gh-icon-btn gh-icon-search" aria-label="Search" onClick={onToggleMobSearch}><IcoSearch/></button>
          <button className="gh-icon-btn" aria-label="Share" onClick={onShareApp}><IcoShare s={16}/></button>
          <button className="gh-icon-btn" aria-label="Saved" onClick={onOpenSaved}><IcoHeart s={17}/></button>
          <div className="gh-profile">
            <ProfileMenu user={user} onSelectBrowse={onSelectBrowse} onSelectProfile={onSelectProfile} onSelectLogout={onSelectLogout}/>
          </div>
        </div>
      </div>
      <div className={`mob-search-bar${mobSearchOpen?' open':''}`}>
        <div className="sbar">
          <span style={{color:'var(--muted)'}}><IcoSearch/></span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={searchPlaceholder}/>
          {search && <button style={{background:'none',border:'none',cursor:'pointer',color:'var(--muted)',padding:0,display:'flex'}} onClick={() => setSearch('')}><IcoX/></button>}
        </div>
      </div>
    </>
  );
}
