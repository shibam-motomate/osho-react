import { IcoBack, IcoLogOut } from './Icons.jsx';

/* ── Profile ── */
export function AccountScreen({user, onBack, onSignOut}) {
  const initial = (user?.email || '?')[0].toUpperCase();

  return (
    <div>
      <div className="back-bar">
        <button className="back-btn" onClick={onBack}><IcoBack/>Home</button>
      </div>
      <div className="acc-profile">
        <div className="acc-avatar">{initial}</div>
        <div className="acc-email">{user?.email}</div>
        <button className="acc-logout" onClick={onSignOut}><IcoLogOut s={14}/>Log Out</button>
      </div>
    </div>
  );
}
