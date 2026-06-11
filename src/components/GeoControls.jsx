import { LocateFixed, MapPin, Navigation, SlidersHorizontal } from "lucide-react";

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
  const actionLabel = isLoading
    ? "Buscando..."
    : hasLocation
      ? "Atualizar"
      : "Usar localizacao";

  const statusText = getStatusText(locationStatus, locationError);

  return (
    <section className="geo-panel" aria-label="Localizacao e raio">
      <div className="geo-topline">
        <div className="geo-copy">
          <span className="geo-icon">
            {hasLocation ? (
              <Navigation size={16} aria-hidden="true" />
            ) : (
              <MapPin size={16} aria-hidden="true" />
            )}
          </span>
          <div>
            <h2>{hasLocation ? "Perto de voce" : "Encontrar por perto"}</h2>
            <p>{needsLocationForNear ? "Ative para ordenar por distancia." : statusText}</p>
          </div>
        </div>

        <button
          className="geo-action"
          type="button"
          onClick={onRequestLocation}
          disabled={isLoading}
        >
          <LocateFixed size={16} aria-hidden="true" />
          {actionLabel}
        </button>
      </div>

      <fieldset className="radius-control" disabled={!hasLocation}>
        <legend className="sr-only">Raio de busca</legend>
        <div className="radius-topline">
          <span>
            <SlidersHorizontal size={15} aria-hidden="true" />
            Raio
          </span>
          <strong>{radiusKm} km</strong>
        </div>
        <input
          aria-label="Raio de busca em quilometros"
          className="radius-slider"
          type="range"
          min="2"
          max="20"
          step="1"
          value={radiusKm}
          onChange={(event) => onRadiusChange(Number(event.target.value))}
        />
      </fieldset>
    </section>
  );
}

function getStatusText(status, errorMessage) {
  if (status === "cached") {
    return "Usando sua ultima localizacao salva.";
  }

  if (status === "granted") {
    return "Distancias calculadas pela sua localizacao.";
  }

  if (status === "denied" || status === "unavailable") {
    return errorMessage || "Voce ainda pode buscar por cidade ou bairro.";
  }

  return "Ative para ver distancia real e usar raio.";
}
