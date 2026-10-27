/* Supabase (login + synced saves/history) is about 70% of the app's JavaScript, and most
   visitors never sign in. So the library is not part of the main bundle: it's downloaded the
   first time it's needed (a stored session on launch, or opening the login screen), and
   `supabase` below is filled in then. Every other use is behind `user`, which can only be set
   once the client exists, so `supabase` is always ready by the time those run. */
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseEnabled = Boolean(url && anonKey);

export let supabase = null;

let loading = null;
export function loadSupabase() {
  if (!supabaseEnabled) return Promise.resolve(null);
  if (!loading) {
    loading = import('@supabase/supabase-js')
      .then(({createClient}) => (supabase = createClient(url, anonKey)))
      .catch(err => { loading = null; throw err; }); // allow a retry after a network failure
  }
  return loading;
}

/* True when this browser has a saved Supabase session (supabase-js keeps it in localStorage
   as sb-<project>-auth-token) or the URL carries an auth redirect (email confirmation,
   password reset), i.e. when the client is needed straight away on launch. */
export function hasSupabaseSession() {
  if (!supabaseEnabled) return false;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      if (/^sb-.+-auth-token$/.test(localStorage.key(i) || '')) return true;
    }
  } catch (e) {}
  const {hash, search} = window.location;
  return /(access_token|refresh_token|error_description)=/.test(hash) || /[?&](code|token_hash)=/.test(search);
}
