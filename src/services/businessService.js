import { isSupabaseConfigured, supabase } from "./supabaseClient.js";
import {
  formatFullAddress,
  normalizeAddress
} from "./addressService.js";

function ensureSupabase() {
  if (!isSupabaseConfigured) {
    throw new Error("BUSINESS_UNAVAILABLE");
  }
}

function parseLegacyAddress(address) {
  const match = String(address ?? "").match(
    /^(.+?),\s*([^,-]+)\s*-\s*([^,]+),\s*(.+)$/
  );

  if (!match) {
    return {};
  }

  return {
    street: match[1].trim(),
    addressNumber: match[2].trim(),
    neighborhood: match[3].trim(),
    city: match[4].trim()
  };
}

function mapManagedBar(bar) {
  const legacyAddress = parseLegacyAddress(bar.address);
  const inferredState =
    (bar.city ?? legacyAddress.city) === "Volta Redonda"
      ? { state: "Rio de Janeiro", stateCode: "RJ" }
      : {};
  const structuredAddress = normalizeAddress({
    ...legacyAddress,
    ...inferredState,
    addressComplement: bar.address_complement,
    addressNumber: bar.address_number ?? legacyAddress.addressNumber,
    city: bar.city ?? legacyAddress.city,
    latitude: bar.latitude,
    longitude: bar.longitude,
    neighborhood: bar.neighborhood ?? legacyAddress.neighborhood,
    postalCode: bar.postal_code,
    state: bar.state ?? inferredState.state,
    stateCode: bar.state_code ?? inferredState.stateCode,
    street: bar.street ?? legacyAddress.street
  });

  return {
    id: bar.id,
    name: bar.name,
    image: bar.image_url,
    neighborhood: bar.neighborhood,
    city: bar.city,
    isOpen: Boolean(bar.is_open),
    priceLevel: bar.price_level,
    address: bar.address,
    ...structuredAddress,
    hours: bar.hours,
    phone: bar.phone,
    description: bar.description,
    legacyMenu: bar.menu ?? {}
  };
}

function mapCategory(category) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    sortOrder: category.sort_order,
    isActive: category.is_active,
    items: (category.menu_items ?? [])
      .map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description ?? "",
        price: Number(item.price ?? 0),
        isAvailable: item.is_available,
        sortOrder: item.sort_order
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder)
  };
}

function mapPromotion(promotion) {
  return {
    id: promotion.id,
    title: promotion.title,
    description: promotion.description ?? "",
    startsAt: promotion.starts_at ?? "",
    endsAt: promotion.ends_at ?? "",
    isActive: promotion.is_active
  };
}

function mapEvent(event) {
  return {
    id: event.id,
    title: event.title,
    description: event.description ?? "",
    startsAt: event.starts_at ?? "",
    endsAt: event.ends_at ?? "",
    price: event.price === null ? "" : Number(event.price),
    isActive: event.is_active
  };
}

export async function fetchBusinessAccess(userId) {
  ensureSupabase();

  const [membershipsResult, claimsResult] = await Promise.all([
    supabase
      .from("bar_members")
      .select("bar_id, role, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
    supabase
      .from("bar_claims")
      .select(
        "id, bar_id, status, contact_name, contact_phone, business_document, message, review_notes, created_at, updated_at"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
  ]);

  if (membershipsResult.error) {
    throw membershipsResult.error;
  }

  if (claimsResult.error) {
    throw claimsResult.error;
  }

  return {
    memberships: membershipsResult.data.map((membership) => ({
      barId: membership.bar_id,
      role: membership.role,
      createdAt: membership.created_at
    })),
    claims: claimsResult.data.map((claim) => ({
      id: claim.id,
      barId: claim.bar_id,
      status: claim.status,
      contactName: claim.contact_name,
      contactPhone: claim.contact_phone,
      businessDocument: claim.business_document ?? "",
      message: claim.message ?? "",
      reviewNotes: claim.review_notes ?? "",
      createdAt: claim.created_at,
      updatedAt: claim.updated_at
    }))
  };
}

export async function createBarClaim(userId, claim) {
  ensureSupabase();

  const { data, error } = await supabase
    .from("bar_claims")
    .insert({
      bar_id: claim.barId,
      user_id: userId,
      contact_name: claim.contactName.trim(),
      contact_phone: claim.contactPhone.trim(),
      business_document: claim.businessDocument.trim() || null,
      message: claim.message.trim() || null
    })
    .select(
      "id, bar_id, status, contact_name, contact_phone, business_document, message, review_notes, created_at, updated_at"
    )
    .single();

  if (error) {
    throw error;
  }

  return {
    id: data.id,
    barId: data.bar_id,
    status: data.status,
    contactName: data.contact_name,
    contactPhone: data.contact_phone,
    businessDocument: data.business_document ?? "",
    message: data.message ?? "",
    reviewNotes: data.review_notes ?? "",
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

export async function fetchManagedBarData(barId) {
  ensureSupabase();

  const [barResult, categoriesResult, promotionsResult, eventsResult] =
    await Promise.all([
      supabase.from("bars").select("*").eq("id", barId).single(),
      supabase
        .from("menu_categories")
        .select(
          "id, name, slug, sort_order, is_active, menu_items(id, name, description, price, is_available, sort_order)"
        )
        .eq("bar_id", barId)
        .order("sort_order", { ascending: true }),
      supabase
        .from("promotions")
        .select("*")
        .eq("bar_id", barId)
        .order("created_at", { ascending: false }),
      supabase
        .from("bar_events")
        .select("*")
        .eq("bar_id", barId)
        .order("starts_at", { ascending: true })
    ]);

  const error =
    barResult.error ||
    categoriesResult.error ||
    promotionsResult.error ||
    eventsResult.error;

  if (error) {
    throw error;
  }

  return {
    bar: mapManagedBar(barResult.data),
    categories: categoriesResult.data.map(mapCategory),
    promotions: promotionsResult.data.map(mapPromotion),
    events: eventsResult.data.map(mapEvent)
  };
}

export async function updateManagedBar(barId, bar) {
  ensureSupabase();
  const structuredAddress = normalizeAddress(bar);
  const publicAddress =
    formatFullAddress(structuredAddress) || String(bar.address ?? "").trim();

  const { data, error } = await supabase
    .from("bars")
    .update({
      name: bar.name.trim(),
      neighborhood: bar.neighborhood.trim(),
      city: bar.city.trim(),
      image_url: bar.image.trim(),
      latitude: structuredAddress.latitude,
      longitude: structuredAddress.longitude,
      is_open: bar.isOpen,
      price_level: bar.priceLevel,
      address: publicAddress,
      postal_code: structuredAddress.postalCode || null,
      street: structuredAddress.street || null,
      address_number: structuredAddress.addressNumber || null,
      address_complement: structuredAddress.addressComplement || null,
      state: structuredAddress.state || null,
      state_code: structuredAddress.stateCode || null,
      hours: bar.hours.trim(),
      phone: bar.phone.trim(),
      description: bar.description.trim(),
      updated_at: new Date().toISOString()
    })
    .eq("id", barId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapManagedBar(data);
}

export async function replaceManagedMenu(barId, categories) {
  ensureSupabase();

  const { error } = await supabase.rpc("replace_bar_menu", {
    target_bar_id: barId,
    categories: categories.map((category, categoryIndex) => ({
      name: category.name.trim(),
      slug: category.slug?.trim() || "",
      sortOrder: categoryIndex,
      isActive: category.isActive,
      items: category.items.map((item, itemIndex) => ({
        name: item.name.trim(),
        description: item.description.trim(),
        price: Number(item.price || 0),
        isAvailable: item.isAvailable,
        sortOrder: itemIndex
      }))
    }))
  });

  if (error) {
    throw error;
  }
}

export async function replaceManagedPromotions(barId, promotions) {
  ensureSupabase();

  const { error } = await supabase.rpc("replace_bar_promotions", {
    target_bar_id: barId,
    promotion_list: promotions.map((promotion) => ({
      title: promotion.title.trim(),
      description: promotion.description.trim(),
      startsAt: promotion.startsAt || "",
      endsAt: promotion.endsAt || "",
      isActive: promotion.isActive
    }))
  });

  if (error) {
    throw error;
  }
}

export async function replaceManagedEvents(barId, events) {
  ensureSupabase();

  const { error } = await supabase.rpc("replace_bar_events", {
    target_bar_id: barId,
    event_list: events.map((event) => ({
      title: event.title.trim(),
      description: event.description.trim(),
      startsAt: event.startsAt || "",
      endsAt: event.endsAt || "",
      price: event.price === "" ? "" : Number(event.price),
      isActive: event.isActive
    }))
  });

  if (error) {
    throw error;
  }
}
