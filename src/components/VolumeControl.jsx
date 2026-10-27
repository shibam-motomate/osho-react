import { setVolume, useVolume, volumeSupported } from '../lib/volume.js';
import { IcoVolume, IcoVolumeLow, IcoVolumeMute } from './Icons.jsx';

/* Speaker button (mute / unmute) and a volume slider. Hidden where the page can't set volume
   (iPhone, iPad). The slider is a native range input, so arrow keys, screen readers and touch all
   work; its keys don't reach the app-wide ←/→ seek shortcut. Clicks don't open the full player. */
export function VolumeControl({className = ''}) {
  const {v, muted} = useVolume();
  if (!volumeSupported) return null;
  const level = muted ? 0 : v;
  const Icon = level === 0 ? IcoVolumeMute : level < 0.5 ? IcoVolumeLow : IcoVolume;
  const toggle = () => (level === 0 ? setVolume({muted: false, v: v > 0.05 ? v : 0.6}) : setVolume({muted: true}));
  return (
    <div className={`vol ${className}`} onClick={e => e.stopPropagation()}>
      <button type="button" className="vol-btn" onClick={toggle} aria-label={level === 0 ? 'Unmute' : 'Mute'}><Icon s={20}/></button>
      <input type="range" className="vol-range" min="0" max="100" step="1" value={Math.round(level * 100)}
        style={{'--v': `${level * 100}%`}} aria-label="Volume" aria-valuetext={`${Math.round(level * 100)}%`}
        onChange={e => { const n = +e.target.value / 100; setVolume({v: n, muted: n === 0}); }}
        onKeyDown={e => e.stopPropagation()}/>
    </div>
  );
}
