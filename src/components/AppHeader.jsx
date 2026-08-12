import { useMemo, useState } from "react";
import { Bell, LocateFixed, MapPin, MapPinned, Navigation, Search } from "lucide-react";
import logoSrc from "../assets/bora-bar-icon.png";
import { normalizeText } from "../utils/format.js";
import { formatDistanceKm } from "../utils/geo.js";

export default function AppHeader({
  hasLocation,
  isLoading,
  isUsingProfileLocation,
  locationStatus,
  onRequestLocation,
  searchTerm,
  onSearchChange,
  onSearchSelect,
  resultCount,
  searchSuggestions = [],
  summaryLabel
}) {
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const isLoadingLocation = locationStatus === "loading";
  const locationLabel = isLoadingLocation
    ? "Buscando localizacao"
    : hasLocation
      ? "Atualizar localizacao"
      : isUsingProfileLocation
        ? "Usar GPS em vez do endereco salvo"
        : "Usar minha localizacao";
  const normalizedSearch = normalizeText(searchTerm.trim());
  const visibleSuggestions = useMemo(() => {
    const matches = normalizedSearch
      ? searchSuggestions.filter((suggestion) =>
          normalizeText(
            `${suggestion.label} ${suggestion.detail ?? ""} ${suggestion.typeLabel ?? ""}`
          ).includes(normalizedSearch)
        )
      : searchSuggestions;

    return matches.slice(0, 6);
  }, [normalizedSearch, searchSuggestions]);
  const shouldShowSuggestions =
    isSuggestionsOpen && normalizedSearch.length >= 2 && visibleSuggestions.length > 0;

  function handleSuggestionSelect(suggestion) {
    onSearchSelect?.(suggestion);
    setIsSuggestionsOpen(false);
  }

  return (
    <header className="app-header">
      <div className="app-topbar">
        <div className="brand-lockup">
          <span className="brand-logo-slot" aria-label="Logo Bora Bar">
            <img src={logoSrc} alt="Bora Bar" />
          </span>
          <div className="brand-copy">
            <h1>Bora Bar</h1>
            <p className="brand-kicker">Escolha o bar antes de sair</p>
          </div>
        </div>
        <button
          className="icon-action"
          type="button"
          aria-label="Notificacoes"
          title="Notificacoes"
        >
          <Bell size={19} aria-hidden="true" />
        </button>
      </div>

      <div className={`search-box ${shouldShowSuggestions ? "has-suggestions" : ""}`}>
        <Search size={20} aria-hidden="true" />
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => {
            onSearchChange(event.target.value);
            setIsSuggestionsOpen(true);
          }}
          onFocus={() => setIsSuggestionsOpen(true)}
          onBlur={() => window.setTimeout(() => setIsSuggestionsOpen(false), 120)}
          placeholder="Cidade ou bairro"
          aria-label="Buscar por cidade ou bairro"
          aria-expanded={shouldShowSuggestions}
          aria-controls="search-suggestions"
          autoComplete="off"
        />
        <button
          className={`search-location-action ${hasLocation ? "is-active" : ""}`}
          type="button"
          onClick={onRequestLocation}
          disabled={isLoadingLocation}
          aria-label={locationLabel}
          title={locationLabel}
        >
          {hasLocation ? (
            <Navigation size={17} aria-hidden="true" />
          ) : (
            <LocateFixed size={17} aria-hidden="true" />
          )}
        </button>

        {shouldShowSuggestions && (
          <div className="search-suggestions" id="search-suggestions" role="listbox">
            {visibleSuggestions.map((suggestion) => (
              <button
                className="search-suggestion"
                type="button"
                key={`${suggestion.type}-${suggestion.value}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSuggestionSelect(suggestion)}
                role="option"
              >
                <MapPinned size={16} aria-hidden="true" />
                <span>
                  <strong>{suggestion.label}</strong>
                  <small>{suggestion.detail}</small>
                </span>
                <em>
                  {Number.isFinite(suggestion.distanceKm)
                    ? formatDistanceKm(suggestion.distanceKm)
                    : suggestion.typeLabel}
                </em>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="location-summary" aria-live="polite">
        <MapPin size={18} aria-hidden="true" />
        <span>
          {isLoading ? "Carregando bares" : summaryLabel ?? `${resultCount} bares encontrados`}
        </span>
      </div>
    </header>
  );
}
