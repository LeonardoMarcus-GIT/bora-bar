export function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

export function getStartingPrice(bar) {
  return Math.min(
    ...Object.values(bar.menu)
      .flat()
      .map((item) => item.price)
  );
}

export function normalizeText(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
