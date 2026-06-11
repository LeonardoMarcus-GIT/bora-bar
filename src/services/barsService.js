import { mockBars } from "../data/mockBars.js";
import { mockBarLocations } from "../data/barCoordinates.js";
import { isSupabaseConfigured, supabase } from "./supabaseClient.js";

const imageReplacements = {
  "https://images.unsplash.com/photo-1566737236500-c8ac43014a8e?auto=format&fit=crop&w=1200&q=80":
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80"
};

function getSafeImageUrl(imageUrl) {
  return imageReplacements[imageUrl] ?? imageUrl;
}

function getCoordinate(value, fallbackValue) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallbackValue ?? null;
}

function mapBarFromDatabase(bar) {
  const mockLocation = mockBarLocations[bar.id] ?? {};

  return {
    id: bar.id,
    name: bar.name,
    neighborhood: mockLocation.neighborhood ?? bar.neighborhood,
    city: mockLocation.city ?? bar.city,
    image: getSafeImageUrl(bar.image_url),
    distanceKm: Number(bar.distance_km ?? 0),
    latitude: getCoordinate(mockLocation.latitude, bar.latitude),
    longitude: getCoordinate(mockLocation.longitude, bar.longitude),
    isActive: bar.is_active ?? true,
    isOpen: Boolean(bar.is_open),
    priceLevel: bar.price_level,
    promotion: bar.promotion ?? "",
    address: mockLocation.address ?? bar.address,
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

  return data.map(mapBarFromDatabase).filter((bar) => bar.isActive);
}
