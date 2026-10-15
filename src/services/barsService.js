import { mockBars } from "../data/mockBars.js";
import { isSupabaseConfigured, supabase } from "./supabaseClient.js";

const imageReplacements = {
  "https://images.unsplash.com/photo-1566737236500-c8ac43014a8e?auto=format&fit=crop&w=1200&q=80":
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80"
};

function getSafeImageUrl(imageUrl) {
  return imageReplacements[imageUrl] ?? imageUrl;
}

function getCoordinate(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function mapStructuredMenu(categories, fallbackMenu) {
  const activeCategories = (categories ?? [])
    .filter((category) => category.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);

  if (!activeCategories.length) {
    return fallbackMenu ?? {};
  }

  return Object.fromEntries(
    activeCategories.map((category) => [
      category.name,
      (category.menu_items ?? [])
        .filter((item) => item.is_available)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((item) => ({
          name: item.name,
          description: item.description ?? "",
          price: Number(item.price ?? 0)
        }))
    ])
  );
}

function isCurrentItem(item, now) {
  const startsAt = item.starts_at ? new Date(item.starts_at) : null;
  const endsAt = item.ends_at ? new Date(item.ends_at) : null;

  return (
    item.is_active &&
    (!startsAt || startsAt <= now) &&
    (!endsAt || endsAt >= now)
  );
}

function mapBarFromDatabase(bar) {
  const now = new Date();
  const promotions = (bar.promotions ?? [])
    .filter((promotion) => isCurrentItem(promotion, now))
    .map((promotion) => ({
      id: promotion.id,
      title: promotion.title,
      description: promotion.description ?? "",
      startsAt: promotion.starts_at,
      endsAt: promotion.ends_at
    }));
  const events = (bar.bar_events ?? [])
    .filter(
      (event) =>
        event.is_active &&
        new Date(event.ends_at ?? event.starts_at) >= now
    )
    .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))
    .map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description ?? "",
      startsAt: event.starts_at,
      endsAt: event.ends_at,
      price: event.price === null ? null : Number(event.price)
    }));

  return {
    id: bar.id,
    name: bar.name,
    neighborhood: bar.neighborhood,
    city: bar.city,
    image: getSafeImageUrl(bar.image_url),
    distanceKm: Number(bar.distance_km ?? 0),
    latitude: getCoordinate(bar.latitude),
    longitude: getCoordinate(bar.longitude),
    isActive: bar.is_active ?? true,
    isListed: bar.is_listed ?? true,
    // Pratos do dia: {url, name, price, description}. Aceita o formato antigo {caption}.
    gallery: Array.isArray(bar.gallery)
      ? bar.gallery
          .filter((dish) => dish?.url)
          .map((dish) => ({
            url: dish.url,
            name: dish.name ?? dish.caption ?? "",
            description: dish.description ?? "",
            price: Number.isFinite(Number(dish.price)) && dish.price !== null && dish.price !== ""
              ? Number(dish.price)
              : null
          }))
      : [],
    isOpen: Boolean(bar.is_open),
    priceLevel: bar.price_level,
    promotion: promotions[0]?.title ?? bar.promotion ?? "",
    promotions,
    events,
    address: bar.address,
    hours: bar.hours,
    phone: bar.phone,
    description: bar.description,
    menu: mapStructuredMenu(bar.menu_categories, bar.menu)
  };
}

const FETCH_TIMEOUT_MS = 15000;

// Bar + cardápio estruturado + promoções + eventos, numa consulta só.
const BAR_SELECT = `
      *,
      menu_categories (
        id,
        name,
        slug,
        sort_order,
        is_active,
        menu_items (
          id,
          name,
          description,
          price,
          is_available,
          sort_order
        )
      ),
      promotions (
        id,
        title,
        description,
        starts_at,
        ends_at,
        is_active
      ),
      bar_events (
        id,
        title,
        description,
        starts_at,
        ends_at,
        price,
        is_active
      )
    `;

function createTimeoutSignal(milliseconds) {
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(milliseconds);
  }

  // Navegadores antigos: mesmo efeito com AbortController.
  const controller = new AbortController();
  setTimeout(() => controller.abort(), milliseconds);
  return controller.signal;
}

/**
 * Carrega os bares do Supabase.
 * - Em produção, NUNCA devolve os bares de exemplo: se o banco falhar ou
 *   demorar mais de 15 s, lança erro (o App mostra "tentar de novo").
 * - Banco sem bares ativos devolve lista vazia.
 * - Os bares de exemplo (mockBars) só aparecem rodando localmente
 *   (`npm run dev`) sem as variáveis do Supabase configuradas.
 */
export async function fetchBars() {
  if (!isSupabaseConfigured) {
    if (import.meta.env.DEV) {
      return mockBars;
    }

    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  const { data, error } = await supabase
    .from("bars")
    .select(BAR_SELECT)
    // Só os estabelecimentos que aparecem no guia (os demais têm só a página /r/<id>).
    .eq("is_listed", true)
    .order("name", { ascending: true })
    .abortSignal(createTimeoutSignal(FETCH_TIMEOUT_MS));

  if (error) {
    console.warn("Não foi possível carregar bares do Supabase.", error);
    throw error;
  }

  return (data ?? []).map(mapBarFromDatabase).filter((bar) => bar.isActive);
}

/**
 * Carrega UM estabelecimento pelo id, apareça ou não no guia.
 * Usado pela página avulsa /r/<id> (link e QR Code do próprio estabelecimento).
 * Devolve null se não existir ou estiver desativado; lança erro se o banco falhar.
 */
export async function fetchBarById(barId) {
  if (!isSupabaseConfigured) {
    if (import.meta.env.DEV) {
      return mockBars.find((bar) => bar.id === barId) ?? null;
    }

    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  const { data, error } = await supabase
    .from("bars")
    .select(BAR_SELECT)
    .eq("id", barId)
    .abortSignal(createTimeoutSignal(FETCH_TIMEOUT_MS))
    .maybeSingle();

  if (error) {
    console.warn("Não foi possível carregar o estabelecimento.", error);
    throw error;
  }

  if (!data) {
    return null;
  }

  const bar = mapBarFromDatabase(data);
  return bar.isActive ? bar : null;
}
