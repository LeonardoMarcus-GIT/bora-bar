import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "bora-bar-user-location-v2";
const CACHE_MAX_AGE_MS = 30 * 60 * 1000;
const MAX_ACCEPTED_ACCURACY_METERS = 1000;

function readCachedLocation() {
  try {
    const cachedLocation = JSON.parse(localStorage.getItem(STORAGE_KEY));

    const isFresh = Date.now() - Number(cachedLocation?.timestamp) <= CACHE_MAX_AGE_MS;
    const hasUsableAccuracy =
      Number.isFinite(cachedLocation?.accuracy) &&
      cachedLocation.accuracy <= MAX_ACCEPTED_ACCURACY_METERS;

    if (
      isFresh &&
      hasUsableAccuracy &&
      Number.isFinite(cachedLocation?.latitude) &&
      Number.isFinite(cachedLocation?.longitude)
    ) {
      return cachedLocation;
    }
  } catch {
    // O app continua sem localizacao salva.
  }

  return null;
}

function saveCachedLocation(location) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
  } catch {
    // Se o navegador bloquear armazenamento local, usamos apenas o estado em memoria.
  }
}

export function useGeolocation() {
  const [coordinates, setCoordinates] = useState(null);
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const cachedLocation = readCachedLocation();

    if (cachedLocation) {
      setCoordinates(cachedLocation);
      setStatus("cached");
    }
  }, []);

  const requestLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setStatus("unavailable");
      setErrorMessage("Localizacao indisponivel neste navegador.");
      return;
    }

    setCoordinates(null);
    setStatus("loading");
    setErrorMessage("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          accuracy: position.coords.accuracy,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: Date.now()
        };

        if (nextLocation.accuracy > MAX_ACCEPTED_ACCURACY_METERS) {
          setStatus("unavailable");
          setErrorMessage(
            "A localizacao encontrada esta muito imprecisa. Tente novamente em um local aberto."
          );
          return;
        }

        setCoordinates(nextLocation);
        setStatus("granted");
        saveCachedLocation(nextLocation);
      },
      (error) => {
        setCoordinates(null);
        setStatus(error.code === error.PERMISSION_DENIED ? "denied" : "unavailable");
        setErrorMessage(
          error.code === error.PERMISSION_DENIED
            ? "Permissao de localizacao negada."
            : "Nao foi possivel encontrar sua localizacao agora."
        );
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 20000
      }
    );
  }, []);

  return useMemo(
    () => ({
      coordinates,
      errorMessage,
      hasLocation: Boolean(
        coordinates &&
          Number.isFinite(coordinates.accuracy) &&
          coordinates.accuracy <= MAX_ACCEPTED_ACCURACY_METERS
      ),
      isLoadingLocation: status === "loading",
      requestLocation,
      status
    }),
    [coordinates, errorMessage, requestLocation, status]
  );
}
