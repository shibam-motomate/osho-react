import { useEffect, useState } from 'react';
import { LANGS } from '../config.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { supabase, supabaseEnabled } from '../lib/supabaseClient.js';
import { IcoBack, IcoCheck, IcoChevronRight, IcoClock, IcoHeart, IcoLogOut } from './Icons.jsx';

/* ── My Account: welcome, listening stats, library, preferences, feedback, delete ── */
export function AccountScreen({onBack, onOpenSaved, onOpenHistory, lang, setLang, onAccountDeleted, savedSeriesCount = 0, savedEpisodesCount = 0, historyCount = 0}) {
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
    if (!message || !supabaseEnabled) return;
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
    {value: savedEpisodesCount, label: 'Saved discourses'},
    {value: historyCount, label: 'Recently played'},
  ];

  return (
    <div>
      <div className="back-bar">
        <button className="back-btn" onClick={onBack}><IcoBack/>Home</button>
      </div>
      <div className="page-card-wrap">
        <div className="page-card">

          {/* Welcome header */}
          <div className="ac-welcome">
            <div className="ac-avatar">{initial}</div>
            <div className="ac-welcome-info">
              <div className="ac-welcome-title">Welcome back</div>
              <div className="ac-welcome-email">{user?.email}</div>
            </div>
            <button className="ac-logout" onClick={signOut}><IcoLogOut s={15}/>Log Out</button>
          </div>

          {/* Listening stats */}
          <div className="ac-stats">
            {stats.map(s => (
              <div key={s.label} className="ac-stat">
                <div className="ac-stat-val">{s.value}</div>
                <div className="ac-stat-lbl">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Library */}
          <div className="ac-section">
            <div className="ac-section-lbl">Library</div>
            <div className="ac-links">
              <button className="ac-link" onClick={onOpenSaved}>
                <span className="ac-link-ic" style={{color:'var(--accent)'}}><IcoHeart s={20} filled/></span>
                <div className="ac-link-info">
                  <div className="ac-link-title">Saved</div>
                  <div className="ac-link-sub">Series &amp; discourses you&rsquo;ve kept</div>
                </div>
                <IcoChevronRight/>
              </button>
              <button className="ac-link" onClick={onOpenHistory}>
                <span className="ac-link-ic" style={{color:'var(--gold)'}}><IcoClock s={20}/></span>
                <div className="ac-link-info">
                  <div className="ac-link-title">History</div>
                  <div className="ac-link-sub">Recently played discourses</div>
                </div>
                <IcoChevronRight/>
              </button>
            </div>
          </div>

          {/* Preferences */}
          <div className="ac-section">
            <div className="ac-section-lbl">Preferences</div>
            <div className="ac-pref-row">
              <div className="ac-pref-label">
                <div className="ac-pref-name">Display name</div>
                <div className="ac-pref-desc">The name shown across your account.</div>
              </div>
              <div className="ac-pref-control">
                <input className="ac-input" type="text" value={name} placeholder="Add your name" onChange={e => setName(e.target.value)}/>
                <button className="ac-btn" onClick={saveName} disabled={busy || name.trim() === currentName}>
                  {saved ? 'Saved ✓' : (busy ? 'Saving…' : 'Save')}
                </button>
              </div>
            </div>
            <div className="ac-pref-row">
              <div className="ac-pref-label">
                <div className="ac-pref-name">Interface language</div>
                <div className="ac-pref-desc">Language used for menus and labels.</div>
              </div>
              <div className="ac-pref-control">
                <div className="ac-seg">
                  {Object.entries(LANGS).map(([k, v]) => (
                    <button key={k} className={`ac-seg-btn${lang===k?' active':''}`} onClick={() => setLang(k)}>{v}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Feedback */}
          <div className="ac-section">
            <div className="ac-section-lbl">Feedback</div>
            <div className="ac-pref-row top">
              <div className="ac-pref-label">
                <div className="ac-pref-name">Suggest a feature</div>
                <div className="ac-pref-desc">Have an idea to make this better? We&rsquo;d love to hear it.</div>
              </div>
              <div className="ac-pref-control" style={{display:'block'}}>
                <textarea className="ac-textarea" rows={3} value={suggestion} placeholder="What would you like to see?"
                  onChange={e => setSuggestion(e.target.value)}/>
                {suggestError && <div className="auth-error" style={{marginTop:10}}>{suggestError}</div>}
                <div className="ac-textarea-actions">
                  <button className="ac-btn" style={{height:40}} onClick={submitSuggestion} disabled={suggestBusy || !suggestion.trim()}>
                    {suggestSent ? 'Sent ✓' : (suggestBusy ? 'Sending…' : 'Send')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Delete */}
          <div className="ac-delete-row">
            <div className="ac-delete-label">
              <div className="ac-delete-name">Delete account</div>
              <div className="ac-delete-desc">Permanently removes your account and all saved data. This can&rsquo;t be undone.</div>
            </div>
            <div className="ac-delete-control">
              {deleteError && <div className="auth-error" style={{width:'100%',marginBottom:8}}>{deleteError}</div>}
              {confirmingDelete ? (
                <>
                  <span style={{fontSize:13,fontWeight:600,color:'var(--ink)'}}>Are you sure?</span>
                  <button className="ac-delete-btn" onClick={confirmDelete} disabled={deleting}>{deleting ? 'Deleting…' : 'Yes, Delete'}</button>
                  <button className="ac-cancel-btn" onClick={() => setConfirmingDelete(false)} disabled={deleting}>Cancel</button>
                </>
              ) : (
                <button className="ac-delete-btn" onClick={() => setConfirmingDelete(true)}>Delete Account</button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
