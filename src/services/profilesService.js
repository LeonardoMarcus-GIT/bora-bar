import { isSupabaseConfigured, supabase } from "./supabaseClient.js";

function ensureSupabase() {
  if (!isSupabaseConfigured) {
    throw new Error("Perfil indisponivel no momento.");
  }
}

export async function fetchProfile(userId) {
  ensureSupabase();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, city, neighborhood")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function saveProfile(userId, profile) {
  ensureSupabase();

  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      id: userId,
      display_name: profile.displayName,
      city: profile.city,
      neighborhood: profile.neighborhood,
      updated_at: new Date().toISOString()
    })
    .select("id, display_name, city, neighborhood")
    .single();

  if (error) {
    throw error;
  }

  return data;
}
