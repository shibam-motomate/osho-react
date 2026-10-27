import { IcoArrowUp, IcoSparkles } from './Icons.jsx';

const EXAMPLES = ['Heartbreak', 'Loneliness', 'Anger', 'Fear of death', 'Feeling lost', 'अकेलापन', 'प्रेम', 'चिंता'];

/* ── Ask AI (coming soon): a tab of its own. Explains the planned feature — write how you feel,
   in English or Hindi, and get talks where Osho speaks to it — and shows a non-working preview
   of the box and example feelings. Nothing is sent anywhere yet. ── */
export function AiScreen({onBrowse, t}) {
  return (
    <div className="page-card-wrap ai-wrap">
      <div className="ai-eyebrow"><IcoSparkles s={16}/>{t.comingSoon}</div>
      <h1 className="set-title">{t.aiTitle}</h1>
      <p className="ai-lead">{t.aiLead}</p>

      <div className="ai-card" aria-disabled="true">
        <div className="ai-input" aria-hidden="true">
          <span className="ai-input-ph">{t.aiPlaceholder}</span>
          <span className="ai-send"><IcoArrowUp s={18}/></span>
        </div>
        <div className="ai-chips" aria-label={t.aiExamplesLabel}>
          {EXAMPLES.map(x => <span key={x} className="ai-chip" lang={/[ऀ-ॿ]/.test(x) ? 'hi' : undefined}>{x}</span>)}
        </div>
      </div>

      <ul className="ai-points">
        <li>{t.aiPoint1}</li>
        <li>{t.aiPoint2}</li>
        <li>{t.aiPoint3}</li>
      </ul>

      <button className="btn-primary ai-browse" onClick={onBrowse}>{t.aiBrowse}</button>
    </div>
  );
}
