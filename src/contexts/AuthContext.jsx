import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, supabaseEnabled } from '../lib/supabaseClient.js';

const AuthContext = createContext(null);

export function AuthProvider({children}) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(supabaseEnabled);

  useEffect(() => {
    if (!supabaseEnabled) return;
    supabase.auth.getSession().then(({data}) => {
      setUser(data.session?.user ?? null);
      setAuthLoading(false);
    });
    const {data: sub} = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const notConfigured = () => Promise.resolve({error: {message: 'Login is not configured for this deployment.'}});
  const signUp = (email, password, fullName) => supabaseEnabled
    ? supabase.auth.signUp({email, password, options: {data: {full_name: fullName || undefined}}})
    : notConfigured();
  const signIn = (email, password) => supabaseEnabled ? supabase.auth.signInWithPassword({email, password}) : notConfigured();
  const signOut = () => supabaseEnabled ? supabase.auth.signOut() : Promise.resolve();
  const updateName = fullName => supabaseEnabled ? supabase.auth.updateUser({data: {full_name: fullName}}) : notConfigured();
  const deleteAccount = async () => {
    if (!supabaseEnabled) return notConfigured();
    const {error} = await supabase.rpc('delete_own_account');
    if (!error) await supabase.auth.signOut();
    return {error};
  };

  return (
    <AuthContext.Provider value={{user, authLoading, signUp, signIn, signOut, updateName, deleteAccount}}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
