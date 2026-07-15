import { IcoBook, IcoClock, IcoHeart, IcoHome, IcoUser } from './Icons.jsx';

/* ── Mobile bottom tab bar ── */
export function MobileNav({active, onBrowse, onBooks, onSaved, onHistory, onAccount, t}) {
  return (
    <nav className="mnav">
      <button className={`mnav-item${active==='home'?' active':''}`} onClick={onBrowse}>
        <IcoHome s={21}/><span>Discourses</span>
      </button>
      <button className={`mnav-item${active==='books'?' active':''}`} onClick={onBooks}>
        <IcoBook s={20}/><span>{t.books}</span>
      </button>
      <button className={`mnav-item${active==='saved'?' active':''}`} onClick={onSaved}>
        <IcoHeart s={20}/><span>Saved</span>
      </button>
      <button className={`mnav-item${active==='history'?' active':''}`} onClick={onHistory}>
        <IcoClock s={20}/><span>History</span>
      </button>
      <button className={`mnav-item${active==='account'?' active':''}`} onClick={onAccount}>
        <IcoUser s={20}/><span>Account</span>
      </button>
    </nav>
  );
}
