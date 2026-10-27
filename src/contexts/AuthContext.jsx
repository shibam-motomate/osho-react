import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { hasSupabaseSession, loadSupabase, supabaseEnabled } from '../lib/supabaseClient.js';

const AuthContext = createContext(null);

export function AuthProvider({children}) {
  const [user, setUser] = useState(null);
  // Only "loading" when there is a session to restore; guests are known to be guests at once.
  const [authLoading, setAuthLoading] = useState(hasSupabaseSession);
  const subRef = useRef(null);

  // Load the client (see lib/supabaseClient.js) and start following the session, once.
  const ensureClient = useCallback(async () => {
    const sb = await loadSupabase();
    if (sb && !subRef.current) {
      const {data: sub} = sb.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
      subRef.current = sub.subscription;
      const {data} = await sb.auth.getSession();
      setUser(data.session?.user ?? null);
    }
    return sb;
  }, []);

  useEffect(() => {
    if (hasSupabaseSession()) {
      ensureClient()
        .catch(err => console.error('[supabase] could not load the login library:', err))
        .finally(() => setAuthLoading(false));
    }
    return () => { subRef.current?.unsubscribe(); subRef.current = null; };
  }, [ensureClient]);

  const notConfigured = () => Promise.resolve({error: {message: 'Login is not configured for this deployment.'}});
  const failed = err => ({error: {message: err?.message || 'Could not reach the login service. Check your connection and try again.'}});
  // Each call loads the client first if needed (e.g. a guest signing in for the first time).
  const withClient = fn => async (...args) => {
    if (!supabaseEnabled) return notConfigured();
    let sb;
    try { sb = await ensureClient(); } catch (err) { return failed(err); }
    return fn(sb, ...args);
  };

  const prepare = useCallback(() => { if (supabaseEnabled) ensureClient().catch(() => {}); }, [ensureClient]);
  const signUp = withClient((sb, email, password, fullName) =>
    sb.auth.signUp({email, password, options: {data: {full_name: fullName || undefined}}}));
  const signIn = withClient((sb, email, password) => sb.auth.signInWithPassword({email, password}));
  const signOut = withClient(sb => sb.auth.signOut());
  const updateName = withClient((sb, fullName) => sb.auth.updateUser({data: {full_name: fullName}}));
  const deleteAccount = withClient(async sb => {
    const {error} = await sb.rpc('delete_own_account');
    if (!error) await sb.auth.signOut();
    return {error};
  });

  return (
    <AuthContext.Provider value={{user, authLoading, prepare, signUp, signIn, signOut, updateName, deleteAccount}}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
