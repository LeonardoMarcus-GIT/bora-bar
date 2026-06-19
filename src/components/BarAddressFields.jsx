import { Building2, Hash, LocateFixed, MapPin, Navigation } from "lucide-react";
import { useMemo, useState } from "react";
import {
  fetchAddressByCep,
  formatCep,
  formatFullAddress,
  normalizeAddress,
  onlyDigits
} from "../services/addressService.js";

export default function BarAddressFields({ address, onChange }) {
  const normalizedAddress = useMemo(() => normalizeAddress(address), [address]);
  const [feedback, setFeedback] = useState("");
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const addressPreview = formatFullAddress(normalizedAddress);

  function updateAddress(patch) {
    onChange(
      normalizeAddress({
        ...normalizedAddress,
        ...patch,
        latitude: null,
        longitude: null
      })
    );
    setFeedback("");
  }

  async function findCep(cep) {
    if (onlyDigits(cep).length !== 8) {
      return;
    }

    setIsLoadingCep(true);
    setFeedback("");

    try {
      const foundAddress = await fetchAddressByCep(cep);
      onChange(
        normalizeAddress({
          ...normalizedAddress,
          ...foundAddress,
          addressComplement: normalizedAddress.addressComplement,
          addressNumber: normalizedAddress.addressNumber,
          latitude: null,
          longitude: null,
          locationSource: "cep",
          locationUpdatedAt: ""
        })
      );
      setFeedback(
        "Endereco encontrado. Confira e ajuste numero ou qualquer outro campo."
      );
    } catch {
      setFeedback(
        "Nao encontramos esse CEP. Preencha os campos manualmente."
      );
    } finally {
      setIsLoadingCep(false);
    }
  }

  function handleCepChange(event) {
    const postalCode = formatCep(event.target.value);
    updateAddress({ postalCode });

    if (onlyDigits(postalCode).length === 8) {
      findCep(postalCode);
    }
  }

  return (
    <fieldset className="bar-address-fields">
      <legend>Endereco do estabelecimento</legend>
      <p>
        O CEP preenche os dados automaticamente, mas todos os campos podem ser
        corrigidos.
      </p>

      <div className="profile-grid">
        <label>
          <span>CEP</span>
          <div className="field-with-icon">
            <LocateFixed size={18} aria-hidden="true" />
            <input
              autoComplete="postal-code"
              inputMode="numeric"
              value={normalizedAddress.postalCode}
              onChange={handleCepChange}
              placeholder="00000-000"
            />
          </div>
        </label>

        <label>
          <span>Rua ou avenida</span>
          <div className="field-with-icon">
            <Navigation size={18} aria-hidden="true" />
            <input
              autoComplete="address-line1"
              value={normalizedAddress.street}
              onChange={(event) => updateAddress({ street: event.target.value })}
              placeholder="Rua 33"
            />
          </div>
        </label>
      </div>

      <div className="bar-address-number-grid">
        <label>
          <span>Numero</span>
          <div className="field-with-icon">
            <Hash size={18} aria-hidden="true" />
            <input
              value={normalizedAddress.addressNumber}
              onChange={(event) =>
                updateAddress({ addressNumber: event.target.value })
              }
              placeholder="77"
            />
          </div>
        </label>

        <label>
          <span>Complemento</span>
          <div className="field-with-icon">
            <Building2 size={18} aria-hidden="true" />
            <input
              autoComplete="address-line2"
              value={normalizedAddress.addressComplement}
              onChange={(event) =>
                updateAddress({ addressComplement: event.target.value })
              }
              placeholder="Loja 2, fundos..."
            />
          </div>
        </label>
      </div>

      <div className="profile-grid">
        <label>
          <span>Bairro</span>
          <div className="field-with-icon">
            <MapPin size={18} aria-hidden="true" />
            <input
              autoComplete="address-level3"
              value={normalizedAddress.neighborhood}
              onChange={(event) =>
                updateAddress({ neighborhood: event.target.value })
              }
              placeholder="Vila Santa Cecilia"
            />
          </div>
        </label>

        <label>
          <span>Cidade</span>
          <div className="field-with-icon">
            <MapPin size={18} aria-hidden="true" />
            <input
              autoComplete="address-level2"
              value={normalizedAddress.city}
              onChange={(event) => updateAddress({ city: event.target.value })}
              placeholder="Volta Redonda"
            />
          </div>
        </label>
      </div>

      <div className="bar-address-state-grid">
        <label>
          <span>Estado</span>
          <div className="field-with-icon">
            <MapPin size={18} aria-hidden="true" />
            <input
              autoComplete="address-level1"
              value={normalizedAddress.state}
              onChange={(event) => updateAddress({ state: event.target.value })}
              placeholder="Rio de Janeiro"
            />
          </div>
        </label>

        <label>
          <span>UF</span>
          <div className="field-with-icon">
            <input
              maxLength={2}
              value={normalizedAddress.stateCode}
              onChange={(event) =>
                updateAddress({
                  stateCode: event.target.value.toUpperCase()
                })
              }
              placeholder="RJ"
            />
          </div>
        </label>
      </div>

      {isLoadingCep && <p className="form-hint">Buscando endereco...</p>}
      {feedback && <p className="bar-address-feedback">{feedback}</p>}

      <div className="bar-address-preview">
        <MapPin size={18} aria-hidden="true" />
        <span>
          <strong>Como aparecera no app</strong>
          <small>{addressPreview || "Preencha o endereco acima."}</small>
        </span>
      </div>
    </fieldset>
  );
}
