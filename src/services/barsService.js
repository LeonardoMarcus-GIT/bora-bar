import { mockBars } from "../data/mockBars.js";
import { isSupabaseConfigured, supabase } from "./supabaseClient.js";

function mapBarFromDatabase(bar) {
  return {
    id: bar.id,
    name: bar.name,
    neighborhood: bar.neighborhood,
    city: bar.city,
    image: bar.image_url,
    distanceKm: Number(bar.distance_km ?? 0),
    isOpen: Boolean(bar.is_open),
    priceLevel: bar.price_level,
    promotion: bar.promotion ?? "",
    address: bar.address,
    hours: bar.hours,
    phone: bar.phone,
    description: bar.description,
    menu: bar.menu ?? {}
  };
}

export async function fetchBars() {
  if (!isSupabaseConfigured) {
    return mockBars;
  }

  const { data, error } = await supabase
    .from("bars")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.warn("Nao foi possivel carregar bares do Supabase.", error);
    return mockBars;
  }

  if (!data.length) {
    return mockBars;
  }

  return data.map(mapBarFromDatabase);
}
