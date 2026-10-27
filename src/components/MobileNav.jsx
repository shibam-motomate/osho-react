import { IcoBook, IcoHeadphones, IcoSparkles, IcoUser, IcoVideo } from './Icons.jsx';

/* ── Phone tab bar: five tabs, a word under every icon. Ask AI sits in the middle (coming soon);
   Library holds saved items and recent plays. ── */
export function MobileNav({screen, contentType, onSelectContentType, onOpenSaved, onAccount, onAi, t}) {
  const isHome = screen === 'home' || screen === 'series';
  const items = [
    {key: 'discourses', label: t.discoursesTab, icon: IcoHeadphones, active: isHome && contentType === 'discourses', onClick: () => onSelectContentType('discourses')},
    {key: 'videos', label: t.videosTab, icon: IcoVideo, active: isHome && contentType === 'videos', onClick: () => onSelectContentType('videos')},
    {key: 'ai', label: t.aiTab, icon: IcoSparkles, active: screen === 'ai', onClick: onAi},
    {key: 'saved', label: t.savedTab, icon: IcoBook, active: screen === 'saved', onClick: onOpenSaved},
    {key: 'account', label: t.accountTab, icon: IcoUser, active: screen === 'account' || screen === 'history', onClick: onAccount},
  ];
  return (
    <nav className="mnav" aria-label="Main">
      {items.map(it => {
        const Icon = it.icon;
        return (
          <button key={it.key} className={`mnav-item${it.active?' active':''}`} onClick={it.onClick} aria-current={it.active ? 'page' : undefined}>
            <span className="mnav-ic"><Icon s={26}/></span>
            <span className="mnav-lbl">{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
