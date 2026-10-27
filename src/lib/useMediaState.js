import { useEffect, useState } from 'react';

/* Live state of whichever player element is in use (audio talks or video talks — both stay
   mounted, only the active one fires events): position, length, whether it's loading, and
   how far ahead the browser has downloaded (bufferedEnd, for the YouTube-style lighter bar).

   Talks stream from archive.org with HTTP range requests: playback starts once the first few
   seconds have arrived and the browser keeps downloading ahead while it plays. Seeking past
   the downloaded part makes the browser request that byte range directly.

   loadPct (0–100) is the loading percentage shown while a talk starts or re-buffers. Browsers
   don't report "how close to playable", so it's built from the real loading stages:
     0–70   waiting for archive.org to answer (often 2–7 s before the first byte); eases
            towards 70 over time (about 45 % after 2.5 s, 60 % after 5 s) so it never freezes
     75     the talk's header has arrived (length known)
     75–95  audio downloaded ahead of the play position, out of the ~8 s needed to start
     100    the browser says it can play
   It's time-based, so a throttled background tab doesn't slow it, and it never passes the
   next stage before that stage really happens. In practice the header and first audio arrive
   together, so it usually goes from the eased value straight to 100. */
const AHEAD_TO_START = 8; // seconds of audio ahead of the position that count as "ready"

export function useMediaState(audioRef, videoRef) {
  const [state, setState] = useState({currentTime: 0, duration: 0, loading: false, bufferedEnd: 0, loadPct: 0});

  useEffect(() => {
    const set = patch => setState(s => {
      for (const k in patch) if (s[k] !== patch[k]) return {...s, ...patch};
      return s;
    });
    // End of the downloaded stretch that contains the current position.
    const bufferedEnd = el => {
      const b = el.buffered, t = el.currentTime;
      for (let i = 0; i < b.length; i++) if (b.start(i) <= t + 0.5 && b.end(i) >= t) return b.end(i);
      return 0;
    };
    const dur = el => (Number.isFinite(el.duration) && el.duration > 0 ? el.duration : 0);

    // ── Loading percentage (see the comment above) ──
    let loadingNow = false, shown = 0, target = 0, base = 0, cap = 0, since = 0, timer = null;
    const tick = () => {
      const t = (Date.now() - since) / 1000;
      const eased = base + (cap - base) * (1 - Math.exp(-t / 2.5));
      shown = Math.min(99, Math.max(shown, target, eased));
      set({loadPct: Math.round(shown)});
    };
    const run = () => { if (!timer) timer = setInterval(tick, 100); };
    const halt = () => { clearInterval(timer); timer = null; };
    const begin = el => {
      const headerIn = el.readyState >= 1;
      loadingNow = true;
      shown = target = base = headerIn ? 75 : 0;
      cap = headerIn ? 95 : 70;
      since = Date.now();
      set({loading: true, loadPct: Math.round(shown)});
      if (!el.paused) run();
    };
    const finish = () => { loadingNow = false; halt(); shown = target = 100; set({loading: false, loadPct: 100}); };
    const ahead = el => {
      if (!loadingNow || el.readyState < 1) return;
      const secs = Math.max(0, bufferedEnd(el) - el.currentTime);
      target = Math.max(target, 75 + Math.min(1, secs / AHEAD_TO_START) * 20);
    };

    const on = {
      loadstart: e => { set({currentTime: 0, duration: 0, bufferedEnd: 0}); begin(e.target); },
      loadedmetadata: e => {
        set({duration: dur(e.target)});
        if (loadingNow) { target = Math.max(target, 75); base = Math.max(shown, 75); cap = 95; since = Date.now(); }
      },
      durationchange: e => set({duration: dur(e.target)}),
      timeupdate: e => { set({currentTime: e.target.currentTime, bufferedEnd: bufferedEnd(e.target)}); ahead(e.target); },
      progress: e => { set({bufferedEnd: bufferedEnd(e.target)}); ahead(e.target); },
      seeking: e => set({currentTime: e.target.currentTime}),
      waiting: e => { if (!loadingNow) begin(e.target); else run(); },
      play: e => { if (loadingNow) run(); },
      pause: () => halt(), // a paused talk isn't being fetched for playback; resume the count on play
      canplay: () => finish(),
      playing: () => finish(),
      error: () => { loadingNow = false; halt(); set({loading: false}); },
    };
    const els = [audioRef.current, videoRef.current].filter(Boolean);
    els.forEach(el => Object.entries(on).forEach(([ev, fn]) => el.addEventListener(ev, fn)));
    // Pick up a talk that was already loaded before this component mounted.
    const live = els.find(el => el.getAttribute('src'));
    if (live) set({currentTime: live.currentTime, duration: dur(live), bufferedEnd: bufferedEnd(live)});
    return () => {
      halt();
      els.forEach(el => Object.entries(on).forEach(([ev, fn]) => el.removeEventListener(ev, fn)));
    };
  }, [audioRef, videoRef]);

  return state;
}
