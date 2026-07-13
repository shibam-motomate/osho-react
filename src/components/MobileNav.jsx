import { IcoClock, IcoHeart, IcoHome, IcoUser } from './Icons.jsx';

/* ── Mobile bottom tab bar ── */
export function MobileNav({active, onBrowse, onSaved, onHistory, onAccount}) {
  return (
    <nav className="mnav">
      <button className={`mnav-item${active==='home'?' active':''}`} onClick={onBrowse}>
        <IcoHome s={21}/><span>Browse</span>
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
