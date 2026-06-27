import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LANGS } from '../config.js';
import { IcoCheck, IcoGlobe } from './Icons.jsx';

/* ── Lang dropdown (portal-based to escape sidebar overflow clipping) ── */
export function LangDropdown({lang, setLang}) {
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
      setRect({top: r.bottom + 6, left: r.left, width: r.width});
    }
    setOpen(o => !o);
  };

  const dd = rect && createPortal(
    <div ref={ddRef} className={`lang-dd${open?' open':''}`}
      style={{top:rect.top, left:rect.left, width:rect.width}}>
      {Object.entries(LANGS).map(([k,v]) => (
        <div key={k} className={`lang-opt ${lang===k?'active':''}`} onClick={() => { setLang(k); setOpen(false); }}>
          <span className="ck"><IcoCheck/></span><span>{v}</span>
        </div>
      ))}
    </div>,
    document.body
  );

  return (
    <div className="lang-wrap">
      <button ref={btnRef} className="lang-btn" onClick={toggle}>
        <IcoGlobe/><span style={{flex:1,textAlign:'left'}}>{LANGS[lang]}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{opacity:0.5,transition:'transform 0.2s',transform:open?'rotate(180deg)':'none'}}><path d="M6 9l6 6 6-6"/></svg>
      </button>
      {dd}
    </div>
  );
}

/* Mobile lang dropdown */
export function MobileLangBtn({lang, setLang}) {
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
      setRect({top: r.bottom + 6, right: window.innerWidth - r.right, width: 150});
    }
    setOpen(o => !o);
  };

  const dd = rect && createPortal(
    <div ref={ddRef} className={`lang-dd${open?' open':''}`}
      style={{top:rect.top, right:rect.right, left:'auto', width:rect.width}}>
      {Object.entries(LANGS).map(([k,v]) => (
        <div key={k} className={`lang-opt ${lang===k?'active':''}`} onClick={() => { setLang(k); setOpen(false); }}>
          <span className="ck"><IcoCheck/></span><span>{v}</span>
        </div>
      ))}
    </div>,
    document.body
  );

  return (
    <div>
      <button ref={btnRef} className="mob-lang-btn" onClick={toggle}>
        <IcoGlobe/><span>{LANGS[lang]}</span>
      </button>
      {dd}
    </div>
  );
}
