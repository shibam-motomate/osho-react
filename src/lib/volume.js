import { useSyncExternalStore } from 'react';

/* Playback volume (0–1) and mute, shared by every volume control and applied to both the <audio>
   and <video> elements. Remembered across talks and launches in localStorage.
   iPhones and iPads ignore page volume (only the hardware buttons change it), so there the
   controls are hidden (volumeSupported). */
const KEY = 'osho_volume';

const read = () => {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && typeof s.v === 'number') return {v: Math.min(1, Math.max(0, s.v)), muted: !!s.muted};
  } catch (e) { /* private mode or bad value */ }
  return {v: 1, muted: false};
};

let state = read();
const subs = new Set();
const els = new Set();

const apply = el => { if (el) { el.volume = state.v; el.muted = state.muted; } };

export const volumeSupported = (() => {
  if (typeof document === 'undefined') return false;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return false;
  try { const a = document.createElement('audio'); a.volume = 0.5; return a.volume === 0.5; } catch (e) { return false; }
})();

/* App calls this once with its media refs so the saved volume applies from the first talk. */
export function attachVolume(...refs) {
  refs.forEach(r => { if (r.current) { els.add(r.current); apply(r.current); } });
}

export function setVolume(patch) {
  state = {...state, ...patch};
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  els.forEach(apply);
  subs.forEach(f => f());
}

const subscribe = f => { subs.add(f); return () => subs.delete(f); };
export const useVolume = () => useSyncExternalStore(subscribe, () => state, () => state);
