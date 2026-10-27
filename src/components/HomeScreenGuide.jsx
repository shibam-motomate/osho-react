import { useState } from 'react';
import { detectPlatform, isStandalone, markInstallDismissed, readInstallDismissed, useInstallPrompt } from '../lib/install.js';
import { IcoCheck, IcoMoreVert, IcoPhone, IcoPlusSquare, IcoShare } from './Icons.jsx';

/* ── "Add to your Home Screen": three numbered steps, worded for iPhone Safari or Android
   Chrome (chosen from the user agent; a small switch when neither is detected). On Android,
   when the browser offers a real install prompt, an Install button uses it instead. ── */

const STEPS = {
  ios: [
    <>Open this site in <strong>Safari</strong> and tap the <span className="hsg-kbd"><IcoShare s={16}/>Share</span> button at the bottom of the screen.</>,
    <>Scroll down the list and tap <span className="hsg-kbd"><IcoPlusSquare s={16}/>Add to Home Screen</span>.</>,
    <>Tap <strong>Add</strong> in the top-right corner. Osho will now open from your Home Screen like any other app.</>,
  ],
  android: [
    <>Open this site in <strong>Chrome</strong> and tap the <span className="hsg-kbd"><IcoMoreVert s={16}/>menu</span> button (three dots) at the top right.</>,
    <>Tap <strong>Add to Home screen</strong>. On some phones it says <strong>Install app</strong>.</>,
    <>Tap <strong>Add</strong> or <strong>Install</strong> to confirm. Osho will now open from your Home Screen like any other app.</>,
  ],
};

export function HomeScreenSteps({platform}) {
  return (
    <ol className="hsg-steps">
      {STEPS[platform].map((step, i) => (
        <li key={i} className="hsg-step"><span className="hsg-num" aria-hidden="true">{i + 1}</span><span>{step}</span></li>
      ))}
    </ol>
  );
}

/* Steps + (on Android) the Install button + (when the platform is unknown) an iPhone/Android switch. */
export function HomeScreenGuide({compact = false}) {
  const detected = detectPlatform();
  const [choice, setChoice] = useState(detected === 'android' ? 'android' : 'ios');
  const {prompt, install} = useInstallPrompt();
  const [installed, setInstalled] = useState(false);
  const platform = detected === 'other' ? choice : detected;

  if (installed || isStandalone()) {
    return (
      <div className="hsg-done">
        <span className="hsg-done-ic"><IcoCheck s={18}/></span>
        <span>All set. Osho is already on your Home Screen.</span>
      </div>
    );
  }

  return (
    <div className="hsg">
      {detected === 'other' && (
        <div className="seg" role="group" aria-label="Phone type">
          <button className={`seg-btn${choice === 'ios' ? ' active' : ''}`} onClick={() => setChoice('ios')} aria-pressed={choice === 'ios'}>iPhone</button>
          <button className={`seg-btn${choice === 'android' ? ' active' : ''}`} onClick={() => setChoice('android')} aria-pressed={choice === 'android'}>Android</button>
        </div>
      )}
      {prompt && platform === 'android' && (
        <>
          <button className="btn-primary" onClick={async () => { if (await install()) setInstalled(true); }}>Install Osho</button>
          {!compact && <div className="hsg-or">Or do it by hand</div>}
        </>
      )}
      <HomeScreenSteps platform={platform}/>
    </div>
  );
}

/* Home: a one-time banner for phones that are not running from the Home Screen yet.
   "Not now" / "Got it" hides it for good (localStorage). */
export function InstallBanner({t}) {
  const [hidden, setHidden] = useState(() => isStandalone() || readInstallDismissed() || detectPlatform() === 'other');
  const [open, setOpen] = useState(false);
  const {prompt, install} = useInstallPrompt();
  if (hidden) return null;
  const dismiss = () => { markInstallDismissed(); setHidden(true); };
  const platform = detectPlatform();

  return (
    <section className="install-banner" aria-label={t.homeScreen}>
      <div className="install-banner-head">
        <span className="install-banner-ic"><IcoPhone s={26}/></span>
        <div className="install-banner-info">
          <div className="install-banner-title">{t.homeScreen}</div>
          <div className="install-banner-sub">Opens full screen from your Home Screen, without the browser bar.</div>
        </div>
      </div>
      {open && <HomeScreenSteps platform={platform}/>}
      <div className="install-banner-actions">
        {prompt && platform === 'android' && (
          <button className="btn-primary" onClick={async () => { if (await install()) dismiss(); }}>Install</button>
        )}
        {!open && <button className="btn-pill on" onClick={() => setOpen(true)}>Show me how</button>}
        <button className="btn-pill" onClick={dismiss}>{open ? 'Got it' : 'Not now'}</button>
      </div>
    </section>
  );
}
