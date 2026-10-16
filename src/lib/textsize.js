// Text size: 'normal' (default), 'large' (+12%) or 'xlarge' (+25%), chosen in Account → Appearance.
// Stored in localStorage and applied as <html data-textsize="…">; styles.css scales the key
// text sizes through the --ts multiplier. index.html applies the stored value before React
// mounts, so the first paint is already at the right size (same pattern as theme.js).
export const TEXT_SIZES = ['normal', 'large', 'xlarge'];
const KEY = 'osho_textsize';

export function readTextSize() {
  try {
    const v = localStorage.getItem(KEY);
    return TEXT_SIZES.includes(v) ? v : 'normal';
  } catch (e) {
    return 'normal';
  }
}

export function applyTextSize(size) {
  const s = TEXT_SIZES.includes(size) ? size : 'normal';
  if (s === 'normal') document.documentElement.removeAttribute('data-textsize');
  else document.documentElement.setAttribute('data-textsize', s);
  try { localStorage.setItem(KEY, s); } catch (e) {}
  return s;
}
