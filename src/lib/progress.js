/* Per-talk listening position, kept for every talk ever started (not just the one in the
   mini player, which lives in 'osho_np' / 'osho_time' and is left untouched).

   localStorage 'osho_progress' = { [episodeUrl]: {t: seconds, d: duration seconds, done: bool} }
   Keys are kept in insertion order, newest last, so trimming drops the oldest talks first. */

const KEY = 'osho_progress';
const CAP = 500;
const DONE_WINDOW = 30;   // within this many seconds of the end counts as finished
const MIN_SAVE = 5;       // ignore positions shorter than this — the talk never really started

const read = () => {
  try {
    const m = JSON.parse(localStorage.getItem(KEY) || '{}');
    return m && typeof m === 'object' && !Array.isArray(m) ? m : {};
  } catch (e) { return {}; }
};

let cache = null;
const current = () => cache || (cache = read());

export const loadProgress = () => ({...current()});

export const getProgress = url => (url ? current()[url] : undefined) || null;

/* Record where a talk is. Returns a fresh copy of the whole map (for React state) or null
   when nothing was recorded. `d` may be NaN/0 while metadata is still loading, in which
   case the previously known duration is kept. */
export function saveProgress(url, t, d) {
  if (!url || !(t >= 0)) return null;
  const map = current();
  const prev = map[url];
  const dur = d > 0 && Number.isFinite(d) ? Math.floor(d) : (prev?.d || 0);
  const done = dur > 0 && dur - t <= DONE_WINDOW;
  if (!done && t < MIN_SAVE && !prev) return null;
  const next = {...map};
  delete next[url]; // re-insert at the end so this talk counts as the newest
  next[url] = {t: done ? dur : Math.floor(t), d: dur, done};
  const keys = Object.keys(next);
  for (let i = 0; i < keys.length - CAP; i++) delete next[keys[i]];
  cache = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch (e) {}
  return {...next};
}

/* Whole minutes still to go for a saved entry, given the catalogue duration as a fallback. */
export const minutesLeft = (entry, fallbackSecs = 0) => {
  if (!entry) return 0;
  const d = entry.d > 0 ? entry.d : fallbackSecs;
  return Math.max(0, Math.round((d - entry.t) / 60));
};

export const percentDone = (entry, fallbackSecs = 0) => {
  if (!entry) return 0;
  const d = entry.d > 0 ? entry.d : fallbackSecs;
  return d > 0 ? Math.min(100, (entry.t / d) * 100) : 0;
};
