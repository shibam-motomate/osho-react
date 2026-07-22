import { IcoClock, IcoHeadphones, IcoHeart, IcoUser, IcoVideo } from './Icons.jsx';

/* ── Mobile bottom tab bar — Discourses, Videos, Saved, History, Account.
   Active tab tints maroon with a rounded pill behind the icon. ── */
export function MobileNav({screen, contentType, onSelectContentType, onOpenSaved, onOpenHistory, onAccount, t}) {
  const isHome = screen === 'home' || screen === 'series';
  const items = [
    {key: 'discourses', label: t.discoursesTab, icon: IcoHeadphones, active: isHome && contentType === 'discourses', onClick: () => onSelectContentType('discourses')},
    {key: 'videos', label: t.videosTab, icon: IcoVideo, active: isHome && contentType === 'videos', onClick: () => onSelectContentType('videos')},
    {key: 'saved', label: 'Saved', icon: IcoHeart, active: screen === 'saved', onClick: onOpenSaved},
    {key: 'history', label: 'History', icon: IcoClock, active: screen === 'history', onClick: onOpenHistory},
    {key: 'account', label: 'Account', icon: IcoUser, active: screen === 'account', onClick: onAccount},
  ];
  return (
    <nav className="mnav">
      {items.map(it => {
        const Icon = it.icon;
        return (
          <button key={it.key} className={`mnav-item${it.active?' active':''}`} onClick={it.onClick}>
            <span className="mnav-ic"><Icon s={19}/></span>
            <span className="mnav-lbl">{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
