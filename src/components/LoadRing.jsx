/* Circular loading progress (replaces the old spinner on play buttons). The arc fills to
   `pct`; on the big play button the number sits in the middle. Colour follows the button's
   text colour (currentColor). */
export function LoadRing({pct, size, showNumber = false}) {
  const p = Math.max(0, Math.min(100, Math.round(pct || 0)));
  return (
    <span className="load-ring" style={{'--p': p, width: size, height: size}}
      role="progressbar" aria-label="Loading talk" aria-valuemin={0} aria-valuemax={100} aria-valuenow={p}>
      <span className="load-ring-arc"/>
      {showNumber && <span className="load-ring-num">{p}%</span>}
    </span>
  );
}
