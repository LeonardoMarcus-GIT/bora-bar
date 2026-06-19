const IBGE_BASE_URL = "https://servicodados.ibge.gov.br/api/v1/localidades";

export const emptyAddress = {
  addressComplement: "",
  addressNumber: "",
  city: "",
  cityIbgeCode: "",
  latitude: null,
  longitude: null,
  locationSource: "",
  locationUpdatedAt: "",
  neighborhood: "",
  postalCode: "",
  state: "",
  stateCode: "",
  street: ""
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

function toNullableCoordinate(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

export function normalizeAddress(address = {}) {
  return {
    ...emptyAddress,
    ...address,
    addressComplement: String(
      address.addressComplement ?? address.address_complement ?? ""
    ),
    addressNumber: String(
      address.addressNumber ?? address.address_number ?? ""
    ),
    cityIbgeCode: String(
      address.cityIbgeCode ?? address.city_ibge_code ?? ""
    ),
    latitude: toNullableCoordinate(address.latitude),
    locationSource: String(
      address.locationSource ?? address.location_source ?? ""
    ),
    locationUpdatedAt: String(
      address.locationUpdatedAt ?? address.location_updated_at ?? ""
    ),
    longitude: toNullableCoordinate(address.longitude),
    neighborhood: String(address.neighborhood ?? ""),
    postalCode: formatCep(address.postalCode ?? address.postal_code ?? ""),
    state: String(address.state ?? ""),
    stateCode: String(address.stateCode ?? address.state_code ?? "").toUpperCase(),
    street: String(address.street ?? "")
  };
}

export function hasAddressData(address = {}) {
  const normalizedAddress = normalizeAddress(address);

  return Boolean(
    onlyDigits(normalizedAddress.postalCode) ||
      normalizedAddress.street ||
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
    stateCode: normalizedAddress.stateCode,
    street: normalizedAddress.street.trim(),
    addressNumber: normalizedAddress.addressNumber.trim(),
    addressComplement: normalizedAddress.addressComplement.trim()
  };
}

export function formatFullAddress(address = {}) {
  const normalizedAddress = normalizeAddress(address);
  const streetLine = [
    normalizedAddress.street,
    normalizedAddress.addressNumber
  ]
    .filter(Boolean)
    .join(", ");
  const complement = normalizedAddress.addressComplement
    ? ` - ${normalizedAddress.addressComplement}`
    : "";
  const locationLine = [
    normalizedAddress.neighborhood,
    normalizedAddress.city,
    normalizedAddress.stateCode
  ]
    .filter(Boolean)
    .join(", ");

  return [streetLine ? `${streetLine}${complement}` : "", locationLine]
    .filter(Boolean)
    .join(" - ");
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
    stateCode: data.uf ?? "",
    street: data.logradouro ?? ""
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

export async function geocodeAddress(
  address,
  accessToken,
  { saveProfile = Boolean(accessToken) } = {}
) {
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
    body: JSON.stringify({
      ...toProfilePayload(address),
      saveProfile
    })
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel calcular a localizacao aproximada.");
  }

  return response.json();
}
