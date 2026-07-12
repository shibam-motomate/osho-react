import { useEffect, useRef, useState } from 'react';

const QUOTES = [
  'Life begins where fear ends.',
  "Be — don't try to become.",
  'The moment you accept yourself, you become beautiful.',
  'Love and awareness are two aspects of the same phenomenon.',
  'Drop the idea of becoming someone, because you are already a masterpiece.',
  'Silence is the language of god, all else is poor translation.',
  'Meditation is not control. Meditation is enjoying your freedom, the freedom to be.',
  'Truth is not found through logic; it is a wild flower that needs deep sensitivity, not certainty.',
];

/* ── First-open welcome splash ── */
export function Splash({onDone}) {
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
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
