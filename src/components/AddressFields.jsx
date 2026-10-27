import { LocateFixed, MapPin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { address as t } from "../texts/misc.js";
import {
  fetchAddressByCep,
  fetchCitiesByState,
  fetchStates,
  formatCep,
  normalizeAddress,
  onlyDigits
} from "../services/addressService.js";

export default function AddressFields({ address, disabled = false, onChange }) {
  const normalizedAddress = useMemo(() => normalizeAddress(address), [address]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [isLoadingStates, setIsLoadingStates] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingStates(true);

    fetchStates()
      .then((nextStates) => {
        if (isMounted) {
          setStates(nextStates);
        }
      })
      .catch(() => {
        if (isMounted) {
          setFeedback(t.statesFailed);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingStates(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (!normalizedAddress.stateCode) {
      setCities([]);
      return () => {
        isMounted = false;
      };
    }

    setIsLoadingCities(true);

    fetchCitiesByState(normalizedAddress.stateCode)
      .then((nextCities) => {
        if (isMounted) {
          setCities(nextCities);
        }
      })
      .catch(() => {
        if (isMounted) {
          setCities([]);
          setFeedback(t.citiesFailed);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingCities(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [normalizedAddress.stateCode]);

  function updateAddress(patch) {
    onChange(normalizeAddress({ ...normalizedAddress, ...patch }));
  }

  async function handleCepChange(event) {
    const nextCep = formatCep(event.target.value);
    updateAddress({ postalCode: nextCep });
    setFeedback("");

    if (onlyDigits(nextCep).length !== 8) {
      return;
    }

    setIsLoadingCep(true);

    try {
      const nextAddress = await fetchAddressByCep(nextCep);
      onChange(
        normalizeAddress({
          ...normalizedAddress,
          ...nextAddress,
          latitude: null,
          longitude: null,
          locationSource: "cep",
          locationUpdatedAt: ""
        })
      );
      setFeedback(t.found);
    } catch {
      setFeedback(t.cepNotFound);
    } finally {
      setIsLoadingCep(false);
    }
  }

  function handleStateChange(event) {
    const stateCode = event.target.value;
    const selectedState = states.find((state) => state.code === stateCode);

    updateAddress({
      city: "",
      cityIbgeCode: "",
      latitude: null,
      longitude: null,
      state: selectedState?.name ?? "",
      stateCode
    });
    setFeedback("");
  }

  function handleCityChange(event) {
    const cityIbgeCode = event.target.value;
    const selectedCity = cities.find((city) => city.id === cityIbgeCode);

    updateAddress({
      city: selectedCity?.name ?? "",
      cityIbgeCode,
      latitude: null,
      longitude: null
    });
    setFeedback("");
  }

  function handleNeighborhoodChange(event) {
    updateAddress({
      latitude: null,
      longitude: null,
      neighborhood: event.target.value
    });
    setFeedback("");
  }

  return (
    <fieldset className="address-fields" disabled={disabled}>
      <legend>{t.legend}</legend>
      <p>{t.intro}</p>

      <div className="profile-grid">
        <label>
          <span>{t.cep}</span>
          <div className="field-with-icon">
            <LocateFixed size={18} aria-hidden="true" />
            <input
              inputMode="numeric"
              value={normalizedAddress.postalCode}
              onChange={handleCepChange}
              placeholder="00000-000"
            />
          </div>
        </label>

        <label>
          <span>{t.state}</span>
          <div className="field-with-icon">
            <MapPin size={18} aria-hidden="true" />
            <select
              value={normalizedAddress.stateCode}
              onChange={handleStateChange}
            >
              <option value="">
                {isLoadingStates ? t.loading : t.select}
              </option>
              {states.map((state) => (
                <option key={state.code} value={state.code}>
                  {state.code} - {state.name}
                </option>
              ))}
            </select>
          </div>
        </label>
      </div>

      <div className="profile-grid">
        <label>
          <span>{t.city}</span>
          <div className="field-with-icon">
            <MapPin size={18} aria-hidden="true" />
            <select
              value={normalizedAddress.cityIbgeCode}
              onChange={handleCityChange}
              disabled={!normalizedAddress.stateCode || isLoadingCities}
            >
              <option value="">
                {isLoadingCities ? t.loading : t.select}
              </option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>
        </label>

        <label>
          <span>{t.neighborhood}</span>
          <div className="field-with-icon">
            <MapPin size={18} aria-hidden="true" />
            <input
              value={normalizedAddress.neighborhood}
              onChange={handleNeighborhoodChange}
              placeholder={t.neighborhoodPlaceholder}
            />
          </div>
        </label>
      </div>

      {isLoadingCep && <p className="form-hint">{t.searching}</p>}
      {feedback && <p className="form-feedback">{feedback}</p>}
    </fieldset>
  );
}
