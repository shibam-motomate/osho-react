import { useEffect, useState } from 'react';

/* Live state of whichever player element is in use (audio talks or video talks — both stay
   mounted, only the active one fires events): position, length, whether it's loading, and
   how far ahead the browser has downloaded (bufferedEnd, for the YouTube-style lighter bar).

   Talks stream from archive.org with HTTP range requests: playback starts once the first few
   seconds have arrived and the browser keeps downloading ahead while it plays. Seeking past
   the downloaded part makes the browser request that byte range directly. */
export function useMediaState(audioRef, videoRef) {
  const [state, setState] = useState({currentTime: 0, duration: 0, loading: false, bufferedEnd: 0});

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

    const on = {
      loadstart: e => set({currentTime: 0, duration: 0, bufferedEnd: 0, loading: true}),
      loadedmetadata: e => set({duration: dur(e.target)}),
      durationchange: e => set({duration: dur(e.target)}),
      timeupdate: e => set({currentTime: e.target.currentTime, bufferedEnd: bufferedEnd(e.target)}),
      progress: e => set({bufferedEnd: bufferedEnd(e.target)}),
      seeking: e => set({currentTime: e.target.currentTime}),
      waiting: () => set({loading: true}),
      canplay: () => set({loading: false}),
      playing: () => set({loading: false}),
      error: () => set({loading: false}),
    };
    const els = [audioRef.current, videoRef.current].filter(Boolean);
    els.forEach(el => Object.entries(on).forEach(([ev, fn]) => el.addEventListener(ev, fn)));
    // Pick up a talk that was already loaded before this component mounted.
    const live = els.find(el => el.getAttribute('src'));
    if (live) set({currentTime: live.currentTime, duration: dur(live), bufferedEnd: bufferedEnd(live)});
    return () => els.forEach(el => Object.entries(on).forEach(([ev, fn]) => el.removeEventListener(ev, fn)));
  }, [audioRef, videoRef]);

  return state;
}
