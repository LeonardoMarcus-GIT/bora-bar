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
    .select("*")
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
      city: profile.city,
      city_ibge_code: profile.cityIbgeCode,
      id: userId,
      display_name: profile.displayName,
      latitude: profile.latitude,
      location_source: profile.locationSource,
      location_updated_at: profile.locationUpdatedAt,
      longitude: profile.longitude,
      neighborhood: profile.neighborhood,
      postal_code: profile.postalCode,
      state: profile.state,
      state_code: profile.stateCode,
      updated_at: new Date().toISOString()
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}
