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
