// Appearance: 'dark' (default, the OSHO International look) or 'light' (ivory & maroon).
// Stored in localStorage and applied as <html data-theme="…"> so the CSS tokens in
// styles.css switch. index.html applies the stored value before React mounts, so the
// first paint is already in the right theme.
export const THEMES = ['dark', 'light'];
const KEY = 'osho_theme';
const META_COLOR = {dark: '#141010', light: '#F7F4EF'};

export function readTheme() {
  try {
    const v = localStorage.getItem(KEY);
    return THEMES.includes(v) ? v : 'dark';
  } catch (e) {
    return 'dark';
  }
}

export function applyTheme(theme) {
  const t = THEMES.includes(theme) ? theme : 'dark';
  document.documentElement.setAttribute('data-theme', t);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', META_COLOR[t]);
  try { localStorage.setItem(KEY, t); } catch (e) {}
  return t;
}
