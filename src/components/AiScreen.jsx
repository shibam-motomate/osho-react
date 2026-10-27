import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { IcoFlame, IcoHeartCrack, IcoMic, IcoMoon, IcoSparkles, IcoWind } from './Icons.jsx';

const CARDS = [
  {key: 'heartbreak', icon: IcoHeartCrack},
  {key: 'lonely', icon: IcoMoon},
  {key: 'anxious', icon: IcoWind},
  {key: 'angry', icon: IcoFlame},
];

/* ── Ask AI (coming soon), styled like a chat assistant's home: a rose glow, a "Coming soon" badge,
   a large greeting (with the listener's first name when signed in), four feeling cards and the
   "tell me how you feel" bar. Nothing works yet: tapping a card or the bar makes the badge pulse
   and shows a short "coming soon" note. Nothing is sent anywhere. ── */
export function AiScreen({t}) {
  const {user} = useAuth();
  const first = (user?.user_metadata?.full_name || '').trim().split(/\s+/)[0];
  const [nudge, setNudge] = useState(0);
  const timer = useRef(null);
  const poke = () => {
    setNudge(n => n + 1);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNudge(0), 2600);
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <div className="ai-page">
      <div className="ai-glow" aria-hidden="true"/>
      <div className="ai-wrap">
        <div className="ai-top">
          <span key={nudge} className={`ai-badge${nudge ? ' pulse' : ''}`}><IcoSparkles s={15}/>{t.comingSoon}</span>
        </div>

        <h1 className="ai-hello">
          <span className="ai-hello-name">{first ? t.aiHelloName(first) : t.aiHello}</span>
          {t.aiAsk}
        </h1>

        <div className="ai-bottom">
          <div className="ai-cards">
            {CARDS.map(({key, icon: Icon}) => (
              <button key={key} type="button" className="ai-card" onClick={poke} aria-describedby="ai-soon">
                <span className="ai-card-ic"><Icon s={18}/></span>
                <span className="ai-card-lbl">{t.aiCards[key]}</span>
              </button>
            ))}
          </div>

          <button type="button" className="ai-bar" onClick={poke} aria-describedby="ai-soon">
            <span className="ai-orb" aria-hidden="true"/>
            <span className="ai-bar-ph">{t.aiPlaceholder}</span>
            <span className="ai-mic" aria-hidden="true"><IcoMic s={18}/></span>
          </button>
          <p id="ai-soon" className={`ai-note${nudge ? ' show' : ''}`} role="status">{nudge ? t.aiSoonNote : t.aiFootnote}</p>
        </div>
      </div>
    </div>
  );
}
