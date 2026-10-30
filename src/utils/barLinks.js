// Links de contato e rota de um bar (página do bar e stories usam os mesmos).

// Telefone em dígitos com DDI 55, do jeito que o wa.me espera.
export function getPhoneDigits(phone) {
  const digits = String(phone ?? "").replace(/\D/g, "");
  return digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
}

export function getWhatsappLink(phone) {
  const digits = getPhoneDigits(phone);
  return digits.length >= 12 ? `https://wa.me/${digits}` : "";
}

export function getRouteLinks(bar) {
  const hasCoordinates =
    Number.isFinite(bar.latitude) && Number.isFinite(bar.longitude);
  const destination = hasCoordinates
    ? `${bar.latitude},${bar.longitude}`
    : `${bar.address}, ${bar.city}`;

  return {
    google: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`,
    waze: hasCoordinates
      ? `https://www.waze.com/ul?ll=${encodeURIComponent(destination)}&navigate=yes`
      : `https://www.waze.com/ul?q=${encodeURIComponent(destination)}&navigate=yes`
  };
}
