/* Warm up a talk before it's played. Starting a talk costs ~1 s just to reach archive.org,
   follow its redirect to the file server (dnNNNN.ca.archive.org) and set up both secure
   connections. A header-only request (HEAD) does all of that ahead of time without downloading
   any audio, so when play is tapped the browser reuses the open connections. `credentials:
   'include'` matches how <audio> requests the file, so the same connections are reused.
   Each URL is warmed at most once per visit; failures are ignored (it's only a head start). */
const warmed = new Set();

export function warmTalk(url) {
  if (!url || warmed.has(url) || typeof fetch !== 'function') return;
  if (typeof navigator !== 'undefined' && (navigator.connection?.saveData || navigator.onLine === false)) return;
  warmed.add(url);
  fetch(url, {method: 'HEAD', mode: 'no-cors', credentials: 'include', cache: 'no-store'}).catch(() => {});
}
