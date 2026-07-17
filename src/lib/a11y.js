// Lets non-button "card" elements (styled divs with onClick) respond to Enter/Space
// the same way a native button does, so TV remotes / D-pads can activate them once
// focused. Ignores keydowns that bubbled up from a nested focusable child (e.g. a
// save-heart button inside a card) — only the card's own keydown should activate it,
// mirroring the e.stopPropagation() already used on those children's onClick.
export function onActivateKey(handler) {
  return e => {
    if (e.target !== e.currentTarget) return;
    if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
    e.preventDefault();
    handler(e);
  };
}

// True on Fire TV's Silk browser and other TV browsers, whose remotes are D-pad-only
// (no mouse/touch) — used to widen focus rings and stop keyboard media shortcuts from
// hijacking arrow-key spatial navigation between cards.
export function isTvDevice() {
  return /\b(Silk|AFTB|AFTA|AFTM|AFTN|AFTR|AFTS|AFTT|AFTKA|AFTKM|Fire TV|GoogleTV|SMART-TV|Tizen|Web0S|WebOS|HbbTV|VIDAA|BRAVIA)\b/i.test(navigator.userAgent);
}

// TV browsers' D-pad-driven focus changes don't reliably trigger the browser's default
// "scroll the newly focused element into view" behavior inside nested overflow:auto
// containers (verified: Chromium-based Silk does not do this for our .screen scroll
// area), so this does it explicitly on every focus change — otherwise a card scrolled
// off-screen is reachable by the remote but never becomes visible. Call once on mount.
export function installFocusAutoScroll() {
  const onFocusIn = e => {
    const el = e.target;
    if (el === document.body || el === document.documentElement) return;
    el.scrollIntoView({block: 'nearest', inline: 'nearest'});
  };
  document.addEventListener('focusin', onFocusIn);
  return () => document.removeEventListener('focusin', onFocusIn);
}
