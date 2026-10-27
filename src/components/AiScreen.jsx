import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { IcoArrowUp, IcoFlame, IcoHeartCrack, IcoMic, IcoMoon, IcoSparkles, IcoWind } from './Icons.jsx';

const CARDS = [
  {key: 'heartbreak', icon: IcoHeartCrack},
  {key: 'lonely', icon: IcoMoon},
  {key: 'anxious', icon: IcoWind},
  {key: 'angry', icon: IcoFlame},
];

// The question under the greeting rotates through these, English and Hindi mixed, in random order.
const QUESTIONS = [
  {text: 'How are you feeling today?'},
  {text: 'What is on your heart?'},
  {text: 'What would you like to let go of?'},
  {text: 'आज मन कैसा है?', lang: 'hi'},
  {text: 'दिल में क्या चल रहा है?', lang: 'hi'},
  {text: 'किस बात से मन भारी है?', lang: 'hi'},
];
const ROTATE_MS = 4500;
const shuffled = () => {
  const a = QUESTIONS.map((_, i) => i);
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

/* ── Ask Osho (coming soon), styled like a chat assistant's home: a rose glow, a centred
   "Coming soon" badge over a centred greeting whose question rotates between English and Hindi,
   four feeling cards, and a bar to type or speak (mic and send). Nothing works yet: a card, the
   mic or send pulses the badge and shows a short "coming soon" note. Nothing is sent anywhere. ── */
export function AiScreen({t}) {
  const {user} = useAuth();
  const first = (user?.user_metadata?.full_name || '').trim().split(/\s+/)[0];
  const [order] = useState(shuffled);
  const [step, setStep] = useState(0);
  const [text, setText] = useState('');
  const [nudge, setNudge] = useState(0);
  const timer = useRef(null);

  useEffect(() => {
    const id = setInterval(() => { if (!document.hidden) setStep(s => s + 1); }, ROTATE_MS);
    return () => clearInterval(id);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);

  const poke = () => {
    setNudge(n => n + 1);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNudge(0), 2600);
  };
  const q = QUESTIONS[order[step % order.length]];

  return (
    <div className="ai-page">
      <div className="ai-glow" aria-hidden="true"/>
      <div className="ai-wrap">
        <div className="ai-head">
          <span key={nudge} className={`ai-badge${nudge ? ' pulse' : ''}`}><IcoSparkles s={15}/>{t.comingSoon}</span>
          {/* Screen readers get one steady sentence; the rotating line is visual only. */}
          <h1 className="ai-hello" aria-label={`${first ? t.aiHelloName(first) : t.aiHello} ${t.aiAsk}`}>
            <span className="ai-hello-name" aria-hidden="true">{first ? t.aiHelloName(first) : t.aiHello}</span>
            <span key={step} className="ai-q" lang={q.lang} aria-hidden="true">{q.text}</span>
          </h1>
        </div>

        <div className="ai-bottom">
          <div className="ai-cards">
            {CARDS.map(({key, icon: Icon}) => (
              <button key={key} type="button" className="ai-card" onClick={poke} aria-describedby="ai-soon">
                <span className="ai-card-ic"><Icon s={18}/></span>
                <span className="ai-card-lbl">{t.aiCards[key]}</span>
              </button>
            ))}
          </div>

          <form className="ai-bar" onSubmit={e => { e.preventDefault(); poke(); }}>
            <span className="ai-orb" aria-hidden="true"/>
            <input className="ai-input" value={text} onChange={e => setText(e.target.value)} placeholder={t.aiPlaceholder}
              aria-label={t.aiInputLabel} aria-describedby="ai-soon" enterKeyHint="send" autoComplete="off"
              onKeyDown={e => e.stopPropagation()}/>
            <button type="button" className="ai-mic" onClick={poke} aria-label={t.aiVoice}><IcoMic s={18}/></button>
            <button type="submit" className={`ai-send${text.trim() ? ' ready' : ''}`} aria-label={t.aiSend}><IcoArrowUp s={18}/></button>
          </form>
          <p id="ai-soon" className={`ai-note${nudge ? ' show' : ''}`} role="status">{nudge ? t.aiSoonNote : t.aiFootnote}</p>
        </div>
      </div>
    </div>
  );
}
