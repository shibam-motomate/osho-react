import { useEffect, useState } from 'react';
import { LANGS } from '../config.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { supabase, supabaseEnabled } from '../lib/supabaseClient.js';
import { IcoBack, IcoCheck } from './Icons.jsx';

/* ── My Account: profile, preferences, feedback, delete account ── */
export function AccountScreen({onBack, lang, setLang, onAccountDeleted}) {
  const {user, updateName, deleteAccount} = useAuth();
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

  return (
    <div>
      <div className="back-bar">
        <button className="back-btn" onClick={onBack}><IcoBack/>Home</button>
      </div>
      <h1 className="page-h1">Account</h1>

      <div className="acct-wrap">
        <div className="acct-group-lbl">Profile</div>
        <div className="acct-card">
          <div className="acc-profile">
            <div className="acc-avatar">{initial}</div>
            <div className="acc-email">{user?.email}</div>
          </div>
        </div>

        <div className="acct-group-lbl">Preferences</div>
        <div className="acct-card acct-card-rows">
          <div className="acct-row">
            <div className="acc-lbl">Name</div>
            <div className="acc-name-row">
              <input type="text" value={name} placeholder="Add your name" onChange={e => setName(e.target.value)}/>
              <button className="acc-save-btn" onClick={saveName} disabled={busy || name.trim() === currentName}>
                {saved ? <IcoCheck/> : (busy ? 'Saving…' : 'Save')}
              </button>
            </div>
          </div>
          <div className="acct-row">
            <div className="acc-lbl">UI Language</div>
            <div className="sb-disc" style={{maxWidth:320}}>
              {Object.entries(LANGS).map(([k, v]) => (
                <button key={k} className={`sb-disc-btn ${lang===k?'active':''}`} onClick={() => setLang(k)}>{v}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="acct-group-lbl">Feedback</div>
        <div className="acct-card">
          <div className="acc-lbl">Suggest a Feature</div>
          <p className="acct-danger-copy">Have an idea to make this better? Tell us about it.</p>
          <textarea className="acct-suggest-input" rows={3} value={suggestion} placeholder="What would you like to see?"
            onChange={e => setSuggestion(e.target.value)}/>
          {suggestError && <div className="auth-error" style={{marginTop:10}}>{suggestError}</div>}
          <div className="acct-suggest-row">
            <button className="acc-save-btn" onClick={submitSuggestion} disabled={suggestBusy || !suggestion.trim()}>
              {suggestSent ? <IcoCheck/> : (suggestBusy ? 'Sending…' : 'Send')}
            </button>
          </div>
        </div>

        <div className="acct-group-lbl">Danger Zone</div>
        <div className="acct-card danger">
          <p className="acct-danger-copy">Permanently delete your account and all saved series, discourses, and account data. This can&rsquo;t be undone.</p>
          {deleteError && <div className="auth-error" style={{marginBottom:12}}>{deleteError}</div>}
          {confirmingDelete ? (
            <div className="acct-danger-confirm">
              <span>Are you sure?</span>
              <button className="acct-delete-btn" onClick={confirmDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
              <button className="acct-cancel-btn" onClick={() => setConfirmingDelete(false)} disabled={deleting}>Cancel</button>
            </div>
          ) : (
            <button className="acct-delete-btn" onClick={() => setConfirmingDelete(true)}>Delete Account</button>
          )}
        </div>
      </div>
    </div>
  );
}
