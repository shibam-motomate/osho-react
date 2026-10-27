/* Playback speed and sleep-timer choices, shared by App (which applies them) and the full
   player's pickers. Speed is remembered across talks and launches in localStorage. */
export const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];
export const SLEEP_OPTIONS = ['off', 15, 30, 45, 60, 'end'];

const KEY = 'osho_speed';

export function readSpeed() {
  try {
    const v = parseFloat(localStorage.getItem(KEY));
    return SPEEDS.includes(v) ? v : 1;
  } catch (e) {
    return 1;
  }
}

export function saveSpeed(v) {
  try { localStorage.setItem(KEY, String(v)); } catch (e) {}
}

export const speedLabel = v => `${v}×`;
