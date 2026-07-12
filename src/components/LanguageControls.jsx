import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LANGS } from '../config.js';
import { IcoCheck, IcoGlobe } from './Icons.jsx';

/* ── Icon-only UI-language button + dropdown (portal-based) ── */
export function IconLangButton({lang, setLang, size = 32}) {
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

  const dd = rect && createPortal(
    <div ref={ddRef} className={`lang-dd${open?' open':''}`} style={{top:rect.top, right:rect.right, left:'auto'}}>
      {Object.entries(LANGS).map(([k,v]) => (
        <div key={k} className={`lang-opt ${lang===k?'active':''}`} onClick={() => { setLang(k); setOpen(false); }}>
          <span className="ck"><IcoCheck/></span><span>{v}</span>
        </div>
      ))}
    </div>,
    document.body
  );

  return (
    <div className="icon-btn-wrap">
      <button ref={btnRef} className={`icon-btn${size>=36?' lg':''}`} onClick={toggle} aria-label="App language">
        <IcoGlobe/>
      </button>
      {dd}
    </div>
  );
}
