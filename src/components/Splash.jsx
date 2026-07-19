import { useEffect, useRef, useState } from 'react';
import { OSHO_QUOTES } from '../data/quotes.js';

/* ── First-open welcome splash ── */
export function Splash({onDone}) {
  const [quote] = useState(() => OSHO_QUOTES[Math.floor(Math.random() * OSHO_QUOTES.length)]);
  const [mounted, setMounted] = useState(false);
  const [fading, setFading] = useState(false);
  const dismissedRef = useRef(false);
  const autoTimerRef = useRef(null);

  const dismiss = fast => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    clearTimeout(autoTimerRef.current);
    setFading(true);
    setTimeout(onDone, fast ? 650 : 700);
  };

  useEffect(() => {
    const t1 = setTimeout(() => setMounted(true), 60);
    autoTimerRef.current = setTimeout(() => dismiss(false), 3200);
    return () => { clearTimeout(t1); clearTimeout(autoTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`splash${fading ? ' fading' : ''}`} onClick={() => dismiss(true)}>
      <div className={`splash-content${mounted ? ' in' : ''}`}>
        <div className="splash-eyebrow">Osho Discourses</div>
        <div className="splash-quote">&ldquo;{quote}&rdquo;</div>
        <div className="splash-hint">Tap to begin</div>
      </div>
    </div>
  );
}
