import { useRef, useState } from 'react';

/* ── Sliding segmented control (same look as the English/Hindi switch), used in the player's
   Speed and Sleep sheets. A red pill sits behind the chosen option and slides to the new one.
   Tap an option, or press and drag along the bar: the choice follows your finger and is applied
   as soon as it changes, so you hear a new speed while still dragging. ←/→ move it from the
   keyboard; screen readers get a radio group. ── */
export function SegSlider({options, value, onChange, label, focusable = true}) {
  const ref = useRef(null);
  const dragging = useRef(false);
  const [dragIdx, setDragIdx] = useState(null);
  const n = options.length;
  const idx = Math.max(0, options.findIndex(o => o.value === value));
  const shown = dragIdx ?? idx;

  const idxAt = clientX => {
    const r = ref.current.getBoundingClientRect();
    return Math.max(0, Math.min(n - 1, Math.floor(((clientX - r.left) / r.width) * n)));
  };
  const pick = i => { setDragIdx(i); if (options[i].value !== value) onChange(options[i].value); };

  const onPointerDown = e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragging.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    pick(idxAt(e.clientX));
  };
  const onPointerMove = e => { if (dragging.current) { const i = idxAt(e.clientX); if (i !== dragIdx) pick(i); } };
  const end = () => { dragging.current = false; setDragIdx(null); };

  const onKeyDown = e => {
    const step = {ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1}[e.key];
    if (!step) return;
    e.preventDefault();
    e.stopPropagation(); // keep the app-wide ←/→ seek shortcut out of it
    const i = Math.max(0, Math.min(n - 1, idx + step));
    onChange(options[i].value);
    ref.current.querySelectorAll('button')[i]?.focus();
  };

  return (
    <div className="segs" ref={ref} role="radiogroup" aria-label={label} style={{'--n': n, '--i': shown}}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={end} onPointerCancel={end}
      onKeyDown={onKeyDown}>
      <div className="segs-thumb" aria-hidden="true"/>
      {options.map((o, i) => (
        <button key={String(o.value)} type="button" role="radio" aria-checked={i === idx} aria-label={o.aria || o.label}
          className={i === shown ? 'on' : ''} tabIndex={focusable && i === idx ? 0 : -1}
          onClick={() => o.value !== value && onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
