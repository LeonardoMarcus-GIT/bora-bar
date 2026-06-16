import { isSupabaseConfigured, supabase } from "./supabaseClient.js";

function ensureSupabase() {
  if (!isSupabaseConfigured) {
    throw new Error("Login indisponivel no momento.");
  }
}

function getAppUrl(suffix = "") {
  return `${window.location.origin}/${suffix}`;
}

export async function signUp(email, password, profileData) {
  ensureSupabase();

  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: profileData,
      emailRedirectTo: getAppUrl()
    }
  });
}

export async function signIn(email, password) {
  ensureSupabase();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  ensureSupabase();
  return supabase.auth.signOut();
}

export async function getSession() {
  if (!isSupabaseConfigured) {
    return { data: { session: null }, error: null };
  }

  return supabase.auth.getSession();
}

export function onAuthChange(callback) {
  if (!isSupabaseConfigured) {
    return () => {};
  }

  const { data } = supabase.auth.onAuthStateChange(callback);
  return () => data.subscription.unsubscribe();
}

export async function resetPassword(email) {
  ensureSupabase();

  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getAppUrl("?auth=recovery")
  });
}

export async function updatePassword(newPassword) {
  ensureSupabase();
  return supabase.auth.updateUser({ password: newPassword });
}

export async function updateUserMetadata(profileData) {
  ensureSupabase();
  return supabase.auth.updateUser({ data: profileData });
}
