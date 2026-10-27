import { useRef, useState } from 'react';

/* Spoken position for screen readers, e.g. "12 minutes 5 seconds of 1 hour 38 minutes". */
const spoken = s => {
  s = Math.max(0, Math.floor(s || 0));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const parts = [];
  if (h) parts.push(`${h} hour${h === 1 ? '' : 's'}`);
  if (m) parts.push(`${m} minute${m === 1 ? '' : 's'}`);
  if (!h && (sec || !parts.length)) parts.push(`${sec} second${sec === 1 ? '' : 's'}`);
  return parts.join(' ');
};

/* ── Seek bar shared by the full player and the desktop player bar.
   Drag (mouse, finger or pen) or tap anywhere on it; the hit area is taller than the visible
   track so it's easy to grab. While dragging, the position only previews (onPreview lets the
   parent show the time under the finger) and the seek happens on release, so audio doesn't
   stutter through every intermediate point. Keyboard: ←/→ 10 s, PgUp/PgDn 1 min, Home/End.
   Its own key handling stops the app-wide ←/→ (30 s) shortcut from also firing. ── */
export function Scrubber({currentTime, duration, onSeek, onPreview, className = '', label = 'Position'}) {
  const [drag, setDrag] = useState(null); // seconds under the pointer while dragging
  const dragRef = useRef(null);           // same value, readable synchronously by event handlers
  const ref = useRef(null);
  const ready = duration > 0;

  const timeAt = clientX => {
    const r = ref.current.getBoundingClientRect();
    return Math.max(0, Math.min(duration, ((clientX - r.left) / r.width) * duration));
  };
  const preview = t => { dragRef.current = t; setDrag(t); onPreview?.(t); };
  const end = commit => {
    const t = dragRef.current;
    if (t == null) return;
    dragRef.current = null;
    if (commit) onSeek(t);
    setDrag(null);
    onPreview?.(null);
  };

  const onPointerDown = e => {
    e.stopPropagation();
    if (!ready || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    preview(timeAt(e.clientX));
  };
  const onPointerMove = e => { if (dragRef.current != null) preview(timeAt(e.clientX)); };
  const onPointerUp = e => { e.stopPropagation(); end(true); };

  const onKeyDown = e => {
    if (!ready) return;
    const step = {ArrowRight: 10, ArrowUp: 10, ArrowLeft: -10, ArrowDown: -10, PageUp: 60, PageDown: -60}[e.key];
    let t = null;
    if (step != null) t = currentTime + step;
    else if (e.key === 'Home') t = 0;
    else if (e.key === 'End') t = duration - 1;
    if (t == null) return;
    e.preventDefault();
    e.stopPropagation();
    onSeek(Math.max(0, Math.min(duration, t)));
  };

  const shown = drag ?? currentTime;
  const pct = ready ? Math.min(100, (shown / duration) * 100) : 0;

  return (
    <div className={`scrub${drag != null ? ' dragging' : ''}${ready ? '' : ' idle'} ${className}`}
      ref={ref}
      role="slider" tabIndex={ready ? 0 : -1} aria-label={label}
      aria-valuemin={0} aria-valuemax={Math.floor(duration || 0)} aria-valuenow={Math.floor(shown || 0)}
      aria-valuetext={ready ? `${spoken(shown)} of ${spoken(duration)}` : 'Loading'}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
      onPointerCancel={() => end(false)} onLostPointerCapture={() => end(true)}
      onClick={e => e.stopPropagation()} onKeyDown={onKeyDown}>
      <div className="scrub-track">
        <div className="scrub-fill" style={{width: `${pct}%`}}/>
        <div className="scrub-thumb" style={{left: `${pct}%`}}/>
      </div>
    </div>
  );
}
