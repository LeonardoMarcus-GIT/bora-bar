import { isSupabaseConfigured, supabase } from "./supabaseClient.js";

const SESSION_KEY = "bora-bar-analytics-session";
const ALLOWED_EVENTS = new Set([
  "view",
  "whatsapp",
  "phone",
  "route_google",
  "route_waze",
  "favorite",
  "story_view",
  "story_open"
]);

function getSessionId() {
  try {
    const currentId = sessionStorage.getItem(SESSION_KEY);

    if (currentId) {
      return currentId;
    }

    const nextId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, nextId);
    return nextId;
  } catch {
    return crypto.randomUUID();
  }
}

export async function recordBarEvent(barId, eventType) {
  if (!isSupabaseConfigured || !barId || !ALLOWED_EVENTS.has(eventType)) {
    return false;
  }

  const { error } = await supabase.from("bar_engagement_events").insert({
    bar_id: barId,
    event_type: eventType,
    session_id: getSessionId()
  });

  if (error) {
    console.warn("Métrica do estabelecimento ainda indisponível.", error);
    return false;
  }

  return true;
}

export async function recordBarViewOnce(barId) {
  const viewKey = `bora-bar-viewed-${barId}`;

  try {
    if (sessionStorage.getItem(viewKey)) {
      return false;
    }

    sessionStorage.setItem(viewKey, "1");
  } catch {
    // A visualizacao ainda pode ser registrada se o armazenamento estiver bloqueado.
  }

  return recordBarEvent(barId, "view");
}

export async function fetchBarMetrics(barId, days = 30) {
  if (!isSupabaseConfigured || !barId) {
    return { available: false, days, totals: {} };
  }

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase.rpc("get_bar_metrics", {
    target_bar_id: barId,
    since_at: since.toISOString()
  });

  if (error) {
    console.warn("Não foi possível carregar as métricas do bar.", error);
    return { available: false, days, totals: {} };
  }

  const totals = data.reduce((result, item) => {
    result[item.event_type] = Number(item.total ?? 0);
    return result;
  }, {});

  return { available: true, days, totals };
}

// Visitas da página por dia (últimos `days` dias, com os dias zerados) para o gráfico do painel.
export async function fetchBarDailyViews(barId, days = 7) {
  if (!isSupabaseConfigured || !barId) {
    return [];
  }

  const { data, error } = await supabase.rpc("get_bar_daily_views", {
    target_bar_id: barId,
    day_count: days
  });

  if (error) {
    console.warn("Não foi possível carregar as visitas por dia.", error);
    return [];
  }

  return data.map((item) => ({ day: item.day, total: Number(item.total ?? 0) }));
}
