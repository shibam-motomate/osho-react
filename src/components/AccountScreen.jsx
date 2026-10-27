import { useEffect, useState } from 'react';
import { LANGS } from '../config.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { supabase, supabaseEnabled } from '../lib/supabaseClient.js';
import {
  IcoChevronRight, IcoHeart, IcoHistory, IcoLanguages, IcoLogOut, IcoMessage, IcoPencil, IcoPhone,
  IcoPlaylist, IcoTextSize, IcoTheme, IcoTrash, IcoUser, IcoX,
} from './Icons.jsx';
import { HomeScreenGuide } from './HomeScreenGuide.jsx';
import { SegSlider } from './SegSlider.jsx';
import { Portal } from './Portal.jsx';

const TEXT_SIZE_NAMES = {normal: 'Normal', large: 'Large', xlarge: 'Extra large'};

/* One settings row: icon, label, current value, chevron. `danger` turns it red; `chevron` is off for
   rows that act straight away (Log out). */
function Row({icon: Icon, label, value, onClick, danger = false, chevron = true}) {
  return (
    <button className={`set-row${danger ? ' danger' : ''}`} onClick={onClick}>
      <span className="set-row-ic"><Icon s={20}/></span>
      <span className="set-row-label">{label}</span>
      {value != null && value !== '' && <span className="set-row-value">{value}</span>}
      {chevron && <span className="set-row-chev"><IcoChevronRight s={18}/></span>}
    </button>
  );
}

function Group({title, children}) {
  return (
    <section>
      <h2 className="set-group-title">{title}</h2>
      <div className="set-group">{children}</div>
    </section>
  );
}

/* Bottom sheet on phones, centred dialog on desktop. Keeps the last content while it slides away. */
function SettingsSheet({open, title, onClose, children}) {
  return (
    <Portal>
      <div className={`sheet-scrim${open ? ' open' : ''}`} onClick={onClose}/>
      <div className={`sheet set-sheet${open ? ' open' : ''}`} role="dialog" aria-modal="true" aria-label={title} aria-hidden={!open}>
        <div className="sheet-handle"/>
        <div className="sheet-head">
          <div className="sheet-title">{title}</div>
          <button className="icon-btn" onClick={onClose} aria-label="Close" tabIndex={open ? 0 : -1}><IcoX s={18}/></button>
        </div>
        <div className="set-sheet-body">{children}</div>
      </div>
    </Portal>
  );
}

/* ── Account: a top-level tab (bottom bar on phones, sidebar on desktop), so no back button.
   A profile card, then grouped settings rows (Library, Preferences, App, Account),
   each showing its current value. Choices open a sheet with the same sliding pill as the
   player. Works for guests; name, feedback, log out and delete appear once signed in. ── */
export function AccountScreen({onOpenSaved, onOpenHistory, lang, setLang, theme, setTheme, textSize, setTextSize, onSignIn, onAccountDeleted, t, savedSeriesCount = 0, savedEpisodesCount = 0, historyCount = 0}) {
  const {user, updateName, deleteAccount, signOut} = useAuth();
  const currentName = user?.user_metadata?.full_name || '';
  const [name, setName] = useState(currentName);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [suggestBusy, setSuggestBusy] = useState(false);
  const [suggestSent, setSuggestSent] = useState(false);
  const [suggestError, setSuggestError] = useState('');
  // Which sheet is open, and which one to keep drawing while it slides closed.
  const [sheet, setSheet] = useState(null); // 'theme' | 'text' | 'lang' | 'install' | 'feedback' | 'name' | 'delete'
  const [shown, setShown] = useState(null);
  const open = key => { setShown(key); setSheet(key); };
  const close = () => setSheet(null);

  useEffect(() => { setName(currentName); }, [currentName]);
  useEffect(() => {
    if (!sheet) return;
    const onKey = e => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheet]);

  const saveName = async () => {
    setBusy(true);
    setSaved(false);
    const {error} = await updateName(name.trim());
    setBusy(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => { setSaved(false); close(); }, 900);
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
    setTimeout(() => { setSuggestSent(false); close(); }, 1200);
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
    close();
    onAccountDeleted();
  };

  const initial = (currentName || user?.email || '?')[0].toUpperCase();
  const themeName = theme === 'light' ? t.light : t.dark;

  const sheets = {
    theme: {
      title: t.appearance,
      body: <>
        <SegSlider label={t.appearance} value={theme} onChange={setTheme} focusable={sheet === 'theme'}
          options={[{value: 'dark', label: t.dark}, {value: 'light', label: t.light}]}/>
        <p className="set-sheet-text">{theme === 'light' ? 'Ivory and maroon — easier in bright rooms.' : 'Deep and quiet — easier at night.'}</p>
      </>,
    },
    text: {
      title: t.textSize,
      body: <>
        <SegSlider label={t.textSize} value={textSize} onChange={setTextSize} focusable={sheet === 'text'}
          options={[{value: 'normal', label: 'Normal'}, {value: 'large', label: 'Large'}, {value: 'xlarge', label: 'X-Large', aria: 'Extra large'}]}/>
        <div className="set-preview">Titles, lists and buttons across the app will read at this size.</div>
      </>,
    },
    lang: {
      title: 'Menu language',
      body: <>
        <SegSlider label="Menu language" value={lang} onChange={setLang} focusable={sheet === 'lang'}
          options={Object.entries(LANGS).map(([k, v]) => ({value: k, label: v}))}/>
        <p className="set-sheet-text">Used for menus and labels. Talks keep their own language.</p>
      </>,
    },
    install: {
      title: t.homeScreen,
      body: <>
        <p className="set-sheet-text">Open Osho with one tap, like an app, without the browser bar.</p>
        <HomeScreenGuide/>
      </>,
    },
    feedback: {
      title: 'Suggest a feature',
      body: <>
        <p className="set-sheet-text">Have an idea to make this better? We would love to hear it.</p>
        <textarea className="ac-textarea" rows={4} value={suggestion} placeholder="What would you like to see?" onChange={e => setSuggestion(e.target.value)} aria-label="Suggestion"/>
        {suggestError && <div className="auth-error">{suggestError}</div>}
        <button className="btn-primary" onClick={submitSuggestion} disabled={suggestBusy || !suggestion.trim()}>
          {suggestSent ? 'Sent ✓' : (suggestBusy ? 'Sending…' : 'Send')}
        </button>
      </>,
    },
    name: {
      title: 'Display name',
      body: <>
        <input className="ac-input" type="text" value={name} placeholder="Add your name" onChange={e => setName(e.target.value)} aria-label="Display name"
          onKeyDown={e => { if (e.key === 'Enter' && name.trim() !== currentName) saveName(); }}/>
        <button className="btn-primary" onClick={saveName} disabled={busy || name.trim() === currentName}>
          {saved ? 'Saved ✓' : (busy ? 'Saving…' : 'Save')}
        </button>
      </>,
    },
    delete: {
      title: 'Delete account',
      body: <>
        <p className="set-sheet-text">This permanently removes your account, saved series, saved talks and history. It cannot be undone.</p>
        {deleteError && <div className="auth-error">{deleteError}</div>}
        <button className="btn-danger set-btn-wide" onClick={confirmDelete} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete my account'}</button>
        <button className="psheet-done" onClick={close} disabled={deleting}>Cancel</button>
      </>,
    },
  };

  return (
    <div>
      <div className="page-card-wrap set-wrap">
        <h1 className="set-title">{t.accountTab}</h1>

        {user ? (
          <button className="set-profile" onClick={() => open('name')} aria-label="Edit display name">
            <span className="set-avatar">{initial}</span>
            <span className="set-profile-info">
              <span className="set-profile-name">{currentName || 'Listener'}</span>
              <span className="set-profile-sub">{user.email}</span>
            </span>
            <span className="set-row-chev"><IcoChevronRight s={18}/></span>
          </button>
        ) : (
          <div className="set-profile">
            <span className="set-avatar guest"><IcoUser s={26}/></span>
            <span className="set-profile-info">
              <span className="set-profile-name">Not signed in</span>
              <span className="set-profile-sub">Sign in to keep your saves on every device</span>
            </span>
            <button className="set-signin" onClick={onSignIn}>{t.signIn}</button>
          </div>
        )}

        <Group title={t.library}>
          <Row icon={IcoHeart} label="Saved series" value={savedSeriesCount} onClick={onOpenSaved}/>
          <Row icon={IcoPlaylist} label="Saved talks" value={savedEpisodesCount} onClick={onOpenSaved}/>
          <Row icon={IcoHistory} label={t.recentlyPlayed} value={historyCount} onClick={onOpenHistory}/>
        </Group>

        <Group title={t.preferences}>
          <Row icon={IcoTheme} label={t.appearance} value={themeName} onClick={() => open('theme')}/>
          <Row icon={IcoTextSize} label={t.textSize} value={TEXT_SIZE_NAMES[textSize] || 'Normal'} onClick={() => open('text')}/>
          <Row icon={IcoLanguages} label="Menu language" value={LANGS[lang]} onClick={() => open('lang')}/>
        </Group>

        <Group title="App">
          <Row icon={IcoPhone} label={t.homeScreen} onClick={() => open('install')}/>
          {user && <Row icon={IcoMessage} label="Suggest a feature" onClick={() => open('feedback')}/>}
        </Group>

        {user && (
          <Group title={t.accountTab}>
            <Row icon={IcoPencil} label="Display name" value={currentName || 'Add'} onClick={() => open('name')}/>
            <Row icon={IcoLogOut} label="Log out" onClick={signOut} chevron={false}/>
            <Row icon={IcoTrash} label="Delete account" onClick={() => open('delete')} danger chevron={false}/>
          </Group>
        )}

        <p className="set-foot">{t.footerNote}</p>
      </div>

      <SettingsSheet open={!!sheet} title={shown ? sheets[shown].title : ''} onClose={close}>
        {shown && sheets[shown].body}
      </SettingsSheet>
    </div>
  );
}
