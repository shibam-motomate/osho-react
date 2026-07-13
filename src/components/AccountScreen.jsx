import { useEffect, useState } from 'react';
import { LANGS } from '../config.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { IcoBack, IcoCheck } from './Icons.jsx';

/* ── My Account: name, email, UI language ── */
export function AccountScreen({onBack, lang, setLang}) {
  const {user, updateName} = useAuth();
  const currentName = user?.user_metadata?.full_name || '';
  const [name, setName] = useState(currentName);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

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

  const initial = (currentName || user?.email || '?')[0].toUpperCase();

  return (
    <div>
      <div className="back-bar">
        <button className="back-btn" onClick={onBack}><IcoBack/>Profile</button>
      </div>

      <div className="acc-profile">
        <div className="acc-avatar">{initial}</div>
        <div className="acc-email">{user?.email}</div>
      </div>

      <div className="acc-sec">
        <div className="acc-lbl">Name</div>
        <div className="acc-name-row">
          <input type="text" value={name} placeholder="Add your name" onChange={e => setName(e.target.value)}/>
          <button className="acc-save-btn" onClick={saveName} disabled={busy || name.trim() === currentName}>
            {saved ? <IcoCheck/> : (busy ? 'Saving…' : 'Save')}
          </button>
        </div>
      </div>

      <div className="acc-sec">
        <div className="acc-lbl">UI Language</div>
        <div className="sb-disc" style={{maxWidth:320}}>
          {Object.entries(LANGS).map(([k, v]) => (
            <button key={k} className={`sb-disc-btn ${lang===k?'active':''}`} onClick={() => setLang(k)}>{v}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
