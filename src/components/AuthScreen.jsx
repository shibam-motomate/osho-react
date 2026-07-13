import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { IcoX } from './Icons.jsx';

/* ── Login / signup overlay ── */
export function AuthScreen({onClose}) {
  const {signIn, signUp} = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setError('');
    setInfo('');
    setBusy(true);
    const {error: err} = mode === 'login'
      ? await signIn(email, password)
      : await signUp(email, password);
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (mode === 'signup') {
      setInfo('Check your email to confirm your account, then log in.');
      setMode('login');
      return;
    }
    onClose();
  };

  return (
    <div className="auth-scrim" onClick={onClose}>
      <div className="auth-card" onClick={e => e.stopPropagation()}>
        <button className="auth-close" aria-label="Close" onClick={onClose}><IcoX/></button>
        <div className="auth-title">{mode === 'login' ? 'Log In' : 'Create Account'}</div>
        <div className="auth-sub">{mode === 'login' ? 'Sync your saved series across devices.' : 'Save your favorite series to your account.'}</div>

        <form className="auth-form" onSubmit={submit}>
          <input type="email" placeholder="Email" value={email} autoComplete="email"
                 onChange={e => setEmail(e.target.value)} required/>
          <input type="password" placeholder="Password" value={password} autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                 onChange={e => setPassword(e.target.value)} required minLength={6}/>
          {error && <div className="auth-error">{error}</div>}
          {info && <div className="auth-info">{info}</div>}
          <button type="submit" className="auth-submit" disabled={busy}>
            {busy ? 'Please wait…' : (mode === 'login' ? 'Log In' : 'Sign Up')}
          </button>
        </form>

        <div className="auth-switch">
          {mode === 'login' ? (
            <>Don&rsquo;t have an account? <button onClick={() => { setMode('signup'); setError(''); setInfo(''); }}>Sign up</button></>
          ) : (
            <>Already have an account? <button onClick={() => { setMode('login'); setError(''); setInfo(''); }}>Log in</button></>
          )}
        </div>
      </div>
    </div>
  );
}
