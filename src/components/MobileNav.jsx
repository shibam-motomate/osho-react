import { IcoBook, IcoHeadphones, IcoUser, IcoVideo } from './Icons.jsx';

/* ── Mobile bottom tab bar — content-type switcher + Account; Saved/History are
   reached via the header heart icon and the Account screen respectively. ── */
export function MobileNav({screen, contentType, onSelectContentType, onAccount, t}) {
  const isHome = screen === 'home' || screen === 'series';
  return (
    <nav className="mnav">
      <button className={`mnav-item${isHome && contentType==='discourses'?' active':''}`} onClick={() => onSelectContentType('discourses')}>
        <IcoHeadphones s={20}/><span>{t.discoursesTab}</span>
      </button>
      <button className={`mnav-item${isHome && contentType==='videos'?' active':''}`} onClick={() => onSelectContentType('videos')}>
        <IcoVideo s={20}/><span>{t.videosTab}</span>
      </button>
      <button className={`mnav-item${isHome && contentType==='books'?' active':''}`} onClick={() => onSelectContentType('books')}>
        <IcoBook s={20}/><span>{t.booksTab}</span>
      </button>
      <button className={`mnav-item${screen==='account'?' active':''}`} onClick={onAccount}>
        <IcoUser s={20}/><span>Account</span>
      </button>
    </nav>
  );
}
