import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IcoUser } from './Icons.jsx';

/* ── Top-right profile icon + dropdown: All Discourses / My Profile ── */
export function ProfileMenu({size = 32, onSelectBrowse, onSelectProfile}) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState(null);
  const btnRef = useRef();
  const ddRef  = useRef();

  useEffect(() => {
    const h = e => {
      if (btnRef.current?.contains(e.target)) return;
      if (ddRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setRect({top: r.bottom + 6, right: window.innerWidth - r.right});
    }
    setOpen(o => !o);
  };

  const pick = fn => () => { setOpen(false); fn(); };

  const dd = rect && createPortal(
    <div ref={ddRef} className={`lang-dd${open?' open':''}`} style={{top:rect.top, right:rect.right, left:'auto'}}>
      <div className="lang-opt" onClick={pick(onSelectBrowse)}>All Discourses</div>
      <div className="lang-opt" onClick={pick(onSelectProfile)}>My Profile</div>
    </div>,
    document.body
  );

  return (
    <div className="icon-btn-wrap">
      <button ref={btnRef} className={`icon-btn${size>=36?' lg':''}`} onClick={toggle} aria-label="Profile menu">
        <IcoUser/>
      </button>
      {dd}
    </div>
  );
}
