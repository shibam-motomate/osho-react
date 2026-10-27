import { useEffect, useRef, useState } from 'react';
import { randomQuote } from '../data/quotes.js';

const MIN_SHOW_MS = 1200;   // first visit only (see App) — long enough to take in the quote
const FADE_MS = 550;

/* ── First-load screen: wordmark, a random Osho quote and a progress bar.
   `progress` is 0–100 from App (fonts, catalogue…); the bar glides towards it and
   never jumps backwards. Once it reaches 100 and the minimum time has passed, the
   screen fades and calls onDone. ── */
export function LoadScreen({progress, onDone}) {
  const [quote] = useState(randomQuote);
  const [shown, setShown] = useState(0);
  const [fading, setFading] = useState(false);
  const startedAt = useRef(Date.now());
  const shownRef = useRef(0);
  const doneRef = useRef(false);

  // Glide the bar towards the target, time-based so it behaves the same in a throttled
  // background tab, and creep forward slowly while waiting so it never looks stuck.
  useEffect(() => {
    let last = Date.now();
    const id = setInterval(() => {
      const now = Date.now(), dt = Math.min(1, (now - last) / 180); last = now;
      const target = Math.max(progress, Math.min(90, shownRef.current + 0.4 * dt));
      shownRef.current = Math.min(100, shownRef.current + (target - shownRef.current) * dt);
      setShown(shownRef.current);
    }, 40);
    return () => clearInterval(id);
  }, [progress]);

  useEffect(() => {
    if (progress < 100 || doneRef.current) return;
    const wait = Math.max(0, MIN_SHOW_MS - (Date.now() - startedAt.current)) + 150;
    const t1 = setTimeout(() => {
      setFading(true);
      setTimeout(() => { doneRef.current = true; onDone(); }, FADE_MS);
    }, wait);
    return () => clearTimeout(t1);
  }, [progress, onDone]);

  const pct = Math.round(progress >= 100 && shown > 98 ? 100 : shown);

  return (
    <div className={`load${fading ? ' fading' : ''}`} role="status" aria-live="polite" aria-label="Loading">
      <div className="load-top">
        <div className="wordmark" role="img" aria-label="Osho"/>
        <div className="load-sub">Discourses</div>
      </div>
      <blockquote className="load-quote">
        <p>&ldquo;{quote}&rdquo;</p>
        <footer>&mdash; Osho</footer>
      </blockquote>
      <div className="load-bottom">
        <div className="load-bar" aria-hidden="true"><div className="load-bar-fill" style={{width:`${pct}%`}}/></div>
        <div className="load-lbl">{pct < 100 ? `Loading the library… ${pct}%` : 'Ready'}</div>
      </div>
    </div>
  );
}
