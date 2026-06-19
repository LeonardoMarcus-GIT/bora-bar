import { createClient } from "@supabase/supabase-js";

const cache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30;
let lastNominatimRequestAt = 0;

function cleanText(value) {
  return String(value ?? "").trim();
}

function cleanPostalCode(value) {
  return cleanText(value).replace(/\D/g, "").slice(0, 8);
}

function toNullableNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function joinQuery(parts) {
  return [...parts.filter(Boolean), "Brasil"].join(", ");
}

function buildQueries(address) {
  const postalCode = cleanPostalCode(address.postalCode);
  const street = cleanText(address.street);
  const streetWithNumber = [street, cleanText(address.addressNumber)]
    .filter(Boolean)
    .join(", ");
  const neighborhood = cleanText(address.neighborhood);
  const city = cleanText(address.city);
  const state = cleanText(address.stateCode || address.state);

  return [
    joinQuery([postalCode, streetWithNumber, neighborhood, city, state]),
    joinQuery([street, neighborhood, city, state]),
    joinQuery([postalCode, city, state]),
    joinQuery([neighborhood, city, state]),
    joinQuery([city, state])
  ].filter(
    (query, index, queries) =>
      query !== "Brasil" && queries.indexOf(query) === index
  );
}

function buildCacheKey(address) {
  return [
    cleanPostalCode(address.postalCode),
    cleanText(address.street).toLowerCase(),
    cleanText(address.addressNumber).toLowerCase(),
    cleanText(address.neighborhood).toLowerCase(),
    cleanText(address.city).toLowerCase(),
    cleanText(address.stateCode || address.state).toLowerCase()
  ].join("|");
}

function sendJson(response, statusCode, payload) {
  response.status(statusCode).json(payload);
}

function readBody(request) {
  if (!request.body) {
    return {};
  }

  if (typeof request.body === "string") {
    try {
      return JSON.parse(request.body);
    } catch {
      return {};
    }
  }

  return request.body;
}

async function waitForRateLimit() {
  const elapsed = Date.now() - lastNominatimRequestAt;

  if (elapsed < 1100) {
    await new Promise((resolve) => {
      setTimeout(resolve, 1100 - elapsed);
    });
  }

  lastNominatimRequestAt = Date.now();
}

async function fetchNominatimLocation(address) {
  const cacheKey = buildCacheKey(address);
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.location;
  }

  const queries = buildQueries(address);

  if (queries.length === 0) {
    return null;
  }

  let firstResult = null;

  for (const query of queries) {
    await waitForRateLimit();

    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "br");
    url.searchParams.set("q", query);

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "BoraBar/1.0 (https://bora-bar-three.vercel.app)"
      }
    });

    if (!response.ok) {
      throw new Error("Nominatim request failed.");
    }

    const results = await response.json();
    firstResult = results[0] ?? null;

    if (firstResult) {
      break;
    }
  }

  if (!firstResult) {
    return null;
  }

  const location = {
    latitude: toNullableNumber(firstResult.lat),
    longitude: toNullableNumber(firstResult.lon),
    source: "profile_address",
    updatedAt: new Date().toISOString()
  };

  if (!Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)) {
    return null;
  }

  cache.set(cacheKey, {
    location,
    timestamp: Date.now()
  });

  return location;
}

async function saveProfileLocation(request, address, location) {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    return false;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return false;
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: authHeader
      }
    }
  });

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return false;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      city: cleanText(address.city),
      city_ibge_code: cleanText(address.cityIbgeCode),
      latitude: location.latitude,
      location_source: location.source,
      location_updated_at: location.updatedAt,
      longitude: location.longitude,
      neighborhood: cleanText(address.neighborhood),
      postal_code: cleanText(address.postalCode),
      state: cleanText(address.state),
      state_code: cleanText(address.stateCode)
    })
    .eq("id", user.id);

  return !error;
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  try {
    const address = readBody(request);
    const location = await fetchNominatimLocation(address);

    if (!location) {
      sendJson(response, 404, {
        error: "Location not found.",
        location: null,
        profileSaved: false
      });
      return;
    }

    const profileSaved =
      address.saveProfile === false
        ? false
        : await saveProfileLocation(request, address, location);

    sendJson(response, 200, {
      location,
      profileSaved
    });
  } catch (error) {
    console.error("Geocoding failed.", error);
    sendJson(response, 500, {
      error: "Geocoding failed.",
      location: null,
      profileSaved: false
    });
  }
}
