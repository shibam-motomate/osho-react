import { useEffect, useState } from 'react';
import { LANGS } from '../config.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { supabase, supabaseEnabled } from '../lib/supabaseClient.js';
import { IcoBack, IcoBook, IcoCheck, IcoChevronRight, IcoLogOut, IcoMoonFill, IcoSun, IcoUser } from './Icons.jsx';
import { HomeScreenGuide } from './HomeScreenGuide.jsx';

/* ── Account: works for guests too. Appearance (Dark / Light, Text size), Library, Home Screen guide, Preferences,
   plus name, feedback and delete once signed in. ── */
export function AccountScreen({onBack, onOpenSaved, onOpenHistory, lang, setLang, theme, setTheme, textSize, setTextSize, onSignIn, onAccountDeleted, t, savedSeriesCount = 0, savedEpisodesCount = 0, historyCount = 0}) {
  const {user, updateName, deleteAccount, signOut} = useAuth();
  const currentName = user?.user_metadata?.full_name || '';
  const [name, setName] = useState(currentName);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [suggestBusy, setSuggestBusy] = useState(false);
  const [suggestSent, setSuggestSent] = useState(false);
  const [suggestError, setSuggestError] = useState('');

  useEffect(() => { setName(currentName); }, [currentName]);

  const saveName = async () => {
    setBusy(true);
    setSaved(false);
    const {error} = await updateName(name.trim());
    setBusy(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const submitSuggestion = async () => {
    const message = suggestion.trim();
    if (!message || !supabaseEnabled || !user) return;
    setSuggestBusy(true);
    setSuggestError('');
    const {error} = await supabase.from('feature_suggestions').insert({user_id: user.id, email: user.email, message});
    setSuggestBusy(false);
    if (error) {
      setSuggestError('Something went wrong — please try again.');
      return;
    }
    setSuggestion('');
    setSuggestSent(true);
    setTimeout(() => setSuggestSent(false), 3000);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteError('');
    const {error} = await deleteAccount();
    setDeleting(false);
    if (error) {
      setDeleteError(error.message);
      return;
    }
    onAccountDeleted();
  };

  const initial = (currentName || user?.email || '?')[0].toUpperCase();
  const stats = [
    {value: savedSeriesCount, label: 'Saved series'},
    {value: savedEpisodesCount, label: 'Saved talks'},
    {value: historyCount, label: t.recentlyPlayed},
  ];

  return (
    <div>
      <div className="back-bar">
        <button className="back-btn" onClick={onBack}><IcoBack/>{t.home}</button>
      </div>
      <div className="page-card-wrap">
        <div className="page-card-title-row">
          <div>
            <div className="page-eyebrow">{t.accountTab}</div>
            <div className="page-card-heading"><h1>{user ? 'Welcome back' : 'Your settings'}</h1></div>
          </div>
        </div>

        {/* Who you are / sign in */}
        {user ? (
          <div className="ac-card">
            <div className="ac-welcome">
              <div className="ac-avatar">{initial}</div>
              <div className="ac-welcome-info">
                <div className="ac-welcome-title">{currentName || 'Listener'}</div>
                <div className="ac-welcome-email">{user.email}</div>
              </div>
              <button className="btn-pill" onClick={signOut}><IcoLogOut s={18}/>Log out</button>
            </div>
            <div className="ac-stats">
              {stats.map(s => (
                <div key={s.label} className="ac-stat">
                  <div className="ac-stat-val">{s.value}</div>
                  <div className="ac-stat-lbl">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="ac-card">
            <div className="ac-welcome">
              <div className="ac-avatar"><IcoUser s={28}/></div>
              <div className="ac-welcome-info">
                <div className="ac-welcome-title">Not signed in</div>
              </div>
            </div>
            <div className="ac-guest-text">Sign in to keep your saved series and history on every device. Everything still works without it.</div>
            <button className="btn-primary" onClick={onSignIn}>{t.signIn}</button>
          </div>
        )}

        {/* Appearance */}
        <div className="ac-section-lbl">{t.appearance}</div>
        <div className="ac-card" style={{marginTop:0,gap:0}}>
          <div className="ac-pref" style={{paddingTop:0}}>
            <div>
              <div className="ac-pref-name">Light or dark</div>
              <div className="ac-pref-desc">Changes the colours of the whole app.</div>
            </div>
            <div className="opt-list" role="radiogroup" aria-label={t.appearance}>
              <button className={`opt-row${theme==='dark'?' active':''}`} role="radio" aria-checked={theme==='dark'} onClick={() => setTheme('dark')}>
                <span className="opt-row-ic"><IcoMoonFill s={22}/></span>
                <span className="opt-row-txt">{t.dark}<span className="opt-row-sub">Easier at night</span></span>
                <span className="opt-row-check">{theme==='dark' && <IcoCheck s={20}/>}</span>
              </button>
              <button className={`opt-row${theme==='light'?' active':''}`} role="radio" aria-checked={theme==='light'} onClick={() => setTheme('light')}>
                <span className="opt-row-ic"><IcoSun s={22}/></span>
                <span className="opt-row-txt">{t.light}<span className="opt-row-sub">Easier in bright rooms</span></span>
                <span className="opt-row-check">{theme==='light' && <IcoCheck s={20}/>}</span>
              </button>
            </div>
          </div>
          <div className="ac-pref" style={{paddingBottom:0}}>
            <div>
              <div className="ac-pref-name">{t.textSize}</div>
              <div className="ac-pref-desc">Makes titles, lists and buttons easier to read.</div>
            </div>
            <div className="opt-list" role="radiogroup" aria-label={t.textSize}>
              {[
                {k:'normal', label:t.textNormal, sub:'As designed', a:18},
                {k:'large',  label:t.textLarge,  sub:'About 12% bigger', a:22},
                {k:'xlarge', label:t.textXLarge, sub:'About 25% bigger', a:26},
              ].map(o => (
                <button key={o.k} className={`opt-row${textSize===o.k?' active':''}`} role="radio" aria-checked={textSize===o.k} onClick={() => setTextSize(o.k)}>
                  <span className="opt-row-a" style={{fontSize:o.a}} aria-hidden="true">A</span>
                  <span className="opt-row-txt">{o.label}<span className="opt-row-sub">{o.sub}</span></span>
                  <span className="opt-row-check">{textSize===o.k && <IcoCheck s={20}/>}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Library */}
        <div className="ac-section-lbl">{t.library}</div>
        <div className="ac-links">
          <button className="ac-link" onClick={onOpenSaved}>
            <span className="ac-link-ic"><IcoBook s={24}/></span>
            <div className="ac-link-info">
              <div className="ac-link-title">{t.savedTab}</div>
              <div className="ac-link-sub">Saved series, saved talks and recently played</div>
            </div>
            <IcoChevronRight/>
          </button>
        </div>

        {/* Add to Home Screen */}
        <div className="ac-section-lbl">On your phone</div>
        <div className="ac-card" style={{marginTop:0}}>
          <div>
            <div className="ac-pref-name">{t.homeScreen}</div>
            <div className="ac-pref-desc">Open Osho with one tap, like an app, without the browser bar.</div>
          </div>
          <HomeScreenGuide/>
        </div>

        {/* Preferences */}
        <div className="ac-section-lbl">{t.preferences}</div>
        <div className="ac-card" style={{marginTop:0,gap:0}}>
          <div className="ac-pref">
            <div>
              <div className="ac-pref-name">Menu language</div>
              <div className="ac-pref-desc">Language used for menus and labels.</div>
            </div>
            <div className="opt-list" role="radiogroup" aria-label="Menu language">
              {Object.entries(LANGS).map(([k, v]) => (
                <button key={k} className={`opt-row${lang===k?' active':''}`} role="radio" aria-checked={lang===k} onClick={() => setLang(k)}>
                  <span className="opt-row-txt">{v}</span>
                  <span className="opt-row-check">{lang===k && <IcoCheck s={20}/>}</span>
                </button>
              ))}
            </div>
          </div>
          {user && (
            <div className="ac-pref">
              <div>
                <div className="ac-pref-name">Display name</div>
                <div className="ac-pref-desc">The name shown across your account.</div>
              </div>
              <div className="ac-pref-control">
                <input className="ac-input" type="text" value={name} placeholder="Add your name" onChange={e => setName(e.target.value)} aria-label="Display name"/>
                <button className="ac-btn" onClick={saveName} disabled={busy || name.trim() === currentName}>
                  {saved ? 'Saved ✓' : (busy ? 'Saving…' : 'Save')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Feedback + delete, signed in only */}
        {user && (
          <>
            <div className="ac-section-lbl">Feedback</div>
            <div className="ac-card" style={{marginTop:0}}>
              <div>
                <div className="ac-pref-name">Suggest a feature</div>
                <div className="ac-pref-desc">Have an idea to make this better? We would love to hear it.</div>
              </div>
              <textarea className="ac-textarea" rows={3} value={suggestion} placeholder="What would you like to see?" onChange={e => setSuggestion(e.target.value)} aria-label="Suggestion"/>
              {suggestError && <div className="auth-error">{suggestError}</div>}
              <div className="ac-textarea-actions">
                <button className="ac-btn" onClick={submitSuggestion} disabled={suggestBusy || !suggestion.trim()}>
                  {suggestSent ? 'Sent ✓' : (suggestBusy ? 'Sending…' : 'Send')}
                </button>
              </div>
            </div>

            <div className="ac-delete">
              <div>
                <div className="ac-delete-name">Delete account</div>
                <div className="ac-pref-desc">Permanently removes your account and all saved data. This cannot be undone.</div>
              </div>
              {deleteError && <div className="auth-error">{deleteError}</div>}
              <div className="ac-delete-control">
                {confirmingDelete ? (
                  <>
                    <span style={{fontSize:16,fontWeight:600}}>Are you sure?</span>
                    <button className="btn-danger" onClick={confirmDelete} disabled={deleting}>{deleting ? 'Deleting…' : 'Yes, delete'}</button>
                    <button className="btn-pill" onClick={() => setConfirmingDelete(false)} disabled={deleting}>Cancel</button>
                  </>
                ) : (
                  <button className="btn-danger" onClick={() => setConfirmingDelete(true)}>Delete account</button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
