import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "bora-bar-user-location";

function readCachedLocation() {
  try {
    const cachedLocation = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (
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
        maximumAge: 5 * 60 * 1000,
        timeout: 10000
      }
    );
  }, []);

  return useMemo(
    () => ({
      coordinates,
      errorMessage,
      hasLocation: Boolean(coordinates),
      isLoadingLocation: status === "loading",
      requestLocation,
      status
    }),
    [coordinates, errorMessage, requestLocation, status]
  );
}
