import { LocateFixed, MapPin, Navigation, SlidersHorizontal } from "lucide-react";

const radiusOptions = [2, 5, 10, 20];

export default function GeoControls({
  activeFilters,
  locationError,
  locationStatus,
  onRadiusChange,
  onRequestLocation,
  radiusKm
}) {
  const hasLocation = locationStatus === "granted" || locationStatus === "cached";
  const isLoading = locationStatus === "loading";
  const needsLocationForNear = activeFilters.includes("near") && !hasLocation;

  const statusText = getStatusText(locationStatus, locationError);

  return (
    <section className="geo-panel" aria-label="Localizacao e raio">
      <div className="geo-copy">
        <span className="geo-icon">
          {hasLocation ? (
            <Navigation size={18} aria-hidden="true" />
          ) : (
            <MapPin size={18} aria-hidden="true" />
          )}
        </span>
        <div>
          <h2>{hasLocation ? "Bares perto de voce" : "Encontrar bares por perto"}</h2>
          <p>{needsLocationForNear ? "Ative a localizacao para ordenar por distancia real." : statusText}</p>
        </div>
      </div>

      <button
        className="geo-action"
        type="button"
        onClick={onRequestLocation}
        disabled={isLoading}
      >
        <LocateFixed size={18} aria-hidden="true" />
        {isLoading ? "Buscando..." : hasLocation ? "Atualizar local" : "Usar minha localizacao"}
      </button>

      <fieldset className="radius-control" disabled={!hasLocation}>
        <legend>
          <SlidersHorizontal size={16} aria-hidden="true" />
          Raio
        </legend>
        <div className="radius-options">
          {radiusOptions.map((option) => (
            <button
              className={`radius-chip ${radiusKm === option ? "is-active" : ""}`}
              key={option}
              type="button"
              onClick={() => onRadiusChange(option)}
              aria-pressed={radiusKm === option}
            >
              {option} km
            </button>
          ))}
        </div>
      </fieldset>
    </section>
  );
}

function getStatusText(status, errorMessage) {
  if (status === "cached") {
    return "Usando sua ultima localizacao salva neste navegador.";
  }

  if (status === "granted") {
    return "Distancias calculadas com base na sua localizacao atual.";
  }

  if (status === "denied" || status === "unavailable") {
    return errorMessage || "Voce ainda pode buscar por cidade ou bairro.";
  }

  return "Ative sua localizacao para ver distancia real e filtrar por raio.";
}
