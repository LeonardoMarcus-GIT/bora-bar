export function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

export function getStartingPrice(bar) {
  const prices = Object.values(bar.menu ?? {})
    .flat()
    .map((item) => item.price)
    .filter((price) => Number.isFinite(price));

  return prices.length ? Math.min(...prices) : 0;
}

export function normalizeText(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const SHORT_WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// Data curta de evento para cartões e stories: "Hoje · 21h", "Amanhã · 20h30", "Sáb · 19h".
export function formatEventWhen(value, now = new Date()) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(date) - startOfDay(now)) / 86400000);
  const day = days <= 0 ? "Hoje" : days === 1 ? "Amanhã" : days < 7 ? SHORT_WEEKDAYS[date.getDay()] : date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const minutes = date.getMinutes();
  const time = minutes ? `${date.getHours()}h${String(minutes).padStart(2, "0")}` : `${date.getHours()}h`;
  return `${day} · ${time}`;
}
