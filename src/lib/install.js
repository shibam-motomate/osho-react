// "Add to your Home Screen" helpers. iPhones never show an install prompt, so the app
// explains the steps itself; on Android Chrome the beforeinstallprompt event (captured here
// as early as possible, since it can fire before React mounts) lets us offer a real
// Install button. Dismissing the Home banner is remembered forever in localStorage.
import { useEffect, useState } from 'react';

const DISMISS_KEY = 'osho_install_dismissed';

export function detectPlatform() {
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  // iPadOS Safari reports itself as a Mac; the touch points give it away.
  if (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'other';
}

export function isStandalone() {
  try {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  } catch (e) {
    return false;
  }
}

export function readInstallDismissed() {
  try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch (e) { return false; }
}

export function markInstallDismissed() {
  try { localStorage.setItem(DISMISS_KEY, '1'); } catch (e) {}
}

let deferredPrompt = null;
const listeners = new Set();
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    listeners.forEach(fn => fn(e));
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    listeners.forEach(fn => fn(null));
  });
}

/* The captured beforeinstallprompt event, or null. Re-renders when it arrives or is used. */
export function useInstallPrompt() {
  const [prompt, setPrompt] = useState(deferredPrompt);
  useEffect(() => {
    listeners.add(setPrompt);
    setPrompt(deferredPrompt);
    return () => { listeners.delete(setPrompt); };
  }, []);
  const install = async () => {
    if (!deferredPrompt) return false;
    const ev = deferredPrompt;
    deferredPrompt = null;
    listeners.forEach(fn => fn(null));
    try {
      ev.prompt();
      const {outcome} = await ev.userChoice;
      return outcome === 'accepted';
    } catch (e) {
      return false;
    }
  };
  return {prompt, install};
}
