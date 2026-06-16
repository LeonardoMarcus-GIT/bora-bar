const IBGE_BASE_URL = "https://servicodados.ibge.gov.br/api/v1/localidades";

export const emptyAddress = {
  city: "",
  cityIbgeCode: "",
  latitude: null,
  longitude: null,
  locationSource: "",
  locationUpdatedAt: "",
  neighborhood: "",
  postalCode: "",
  state: "",
  stateCode: ""
};

export function onlyDigits(value) {
  return String(value ?? "").replace(/\D/g, "");
}

export function formatCep(value) {
  const digits = onlyDigits(value).slice(0, 8);

  if (digits.length <= 5) {
    return digits;
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function normalizeAddress(address = {}) {
  return {
    ...emptyAddress,
    ...address,
    cityIbgeCode: String(
      address.cityIbgeCode ?? address.city_ibge_code ?? ""
    ),
    latitude: Number.isFinite(Number(address.latitude))
      ? Number(address.latitude)
      : null,
    locationSource: String(
      address.locationSource ?? address.location_source ?? ""
    ),
    locationUpdatedAt: String(
      address.locationUpdatedAt ?? address.location_updated_at ?? ""
    ),
    longitude: Number.isFinite(Number(address.longitude))
      ? Number(address.longitude)
      : null,
    neighborhood: String(address.neighborhood ?? ""),
    postalCode: formatCep(address.postalCode ?? address.postal_code ?? ""),
    state: String(address.state ?? ""),
    stateCode: String(address.stateCode ?? address.state_code ?? "").toUpperCase()
  };
}

export function hasAddressData(address = {}) {
  const normalizedAddress = normalizeAddress(address);

  return Boolean(
    onlyDigits(normalizedAddress.postalCode) ||
      normalizedAddress.city ||
      normalizedAddress.neighborhood ||
      normalizedAddress.stateCode
  );
}

export function toProfilePayload(address = {}) {
  const normalizedAddress = normalizeAddress(address);

  return {
    city: normalizedAddress.city.trim(),
    cityIbgeCode: String(normalizedAddress.cityIbgeCode ?? "").trim(),
    latitude: normalizedAddress.latitude,
    longitude: normalizedAddress.longitude,
    locationSource: normalizedAddress.locationSource,
    locationUpdatedAt: normalizedAddress.locationUpdatedAt,
    neighborhood: normalizedAddress.neighborhood.trim(),
    postalCode: normalizedAddress.postalCode,
    state: normalizedAddress.state.trim(),
    stateCode: normalizedAddress.stateCode
  };
}

export async function fetchAddressByCep(cep) {
  const digits = onlyDigits(cep);

  if (digits.length !== 8) {
    throw new Error("Informe um CEP com 8 digitos.");
  }

  const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);

  if (!response.ok) {
    throw new Error("Nao foi possivel consultar o CEP.");
  }

  const data = await response.json();

  if (data.erro) {
    throw new Error("CEP nao encontrado.");
  }

  return normalizeAddress({
    city: data.localidade ?? "",
    cityIbgeCode: data.ibge ?? "",
    neighborhood: data.bairro ?? "",
    postalCode: data.cep ?? digits,
    state: data.estado ?? "",
    stateCode: data.uf ?? ""
  });
}

export async function fetchStates() {
  const response = await fetch(`${IBGE_BASE_URL}/estados?orderBy=nome`);

  if (!response.ok) {
    throw new Error("Nao foi possivel carregar estados.");
  }

  const states = await response.json();

  return states.map((state) => ({
    code: state.sigla,
    id: String(state.id),
    name: state.nome
  }));
}

export async function fetchCitiesByState(stateCode) {
  if (!stateCode) {
    return [];
  }

  const response = await fetch(
    `${IBGE_BASE_URL}/estados/${stateCode}/municipios?orderBy=nome`
  );

  if (!response.ok) {
    throw new Error("Nao foi possivel carregar cidades.");
  }

  const cities = await response.json();

  return cities.map((city) => ({
    id: String(city.id),
    name: city.nome
  }));
}

export async function geocodeAddress(address, accessToken) {
  if (!hasAddressData(address)) {
    return {
      location: null,
      profileSaved: false
    };
  }

  const response = await fetch("/api/geocode-profile", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    },
    body: JSON.stringify(toProfilePayload(address))
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel calcular a localizacao aproximada.");
  }

  return response.json();
}
