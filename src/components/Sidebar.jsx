import { IcoHeart, IcoHome, IcoLogOut, IcoUser } from './Icons.jsx';

/* ── Sidebar: app navigation ── */
export function Sidebar({screen, setScreen, user, onOpenAuth, onSignOut}) {
  const isActive = key => key === 'home' ? (screen === 'home' || screen === 'series') : screen === key;
  const go = target => () => target === 'profile' && !user ? onOpenAuth() : setScreen(target);

  return (
    <aside className="sb">
      <div className="sb-logo">
        <div className="wordmark">Osho<em>·</em></div>
        <div className="wordmark-sub">Discourses</div>
      </div>
      <nav className="sb-nav">
        <button className={`sb-nav-item${isActive('home')?' active':''}`} onClick={go('home')}>
          <IcoHome s={17}/><span>Browse</span>
        </button>
        <button className={`sb-nav-item${isActive('saved')?' active':''}`} onClick={go('saved')}>
          <IcoHeart s={17}/><span>Saved</span>
        </button>
        <button className={`sb-nav-item${isActive('profile')?' active':''}`} onClick={go('profile')}>
          <IcoUser s={17}/><span>{user ? 'Profile' : 'Log In'}</span>
        </button>
      </nav>
      <div style={{flex:1}}/>
      {user && (
        <div className="sb-foot">
          <button className="sb-logout-full" onClick={onSignOut}><IcoLogOut s={14}/><span>Log Out</span></button>
        </div>
      )}
    </aside>
  );
}
