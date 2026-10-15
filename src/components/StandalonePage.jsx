import { useEffect, useMemo, useState } from "react";
import BarDetails from "./BarDetails.jsx";
import { useGeolocation } from "../hooks/useGeolocation.js";
import { fetchBarById } from "../services/barsService.js";
import { calculateDistanceKm } from "../utils/geo.js";
import { getOpenStatus } from "../utils/openingHours.js";

// Página avulsa do estabelecimento: /r/<id>.
// É o "site" do restaurante/bar para QR Code e link no Instagram, sem a marca
// Bora Bar. Usa o MESMO componente da página de detalhes do app (BarDetails),
// para o design ser idêntico — só sem "Voltar", "Favoritar" e avaliações.
export default function StandalonePage({ barId }) {
  const [bar, setBar] = useState(null);
  const [state, setState] = useState("loading");
  const [reloadKey, setReloadKey] = useState(0);
  const [now, setNow] = useState(() => new Date());
  const {
    coordinates,
    hasLocation,
    requestLocation,
    status: locationStatus
  } = useGeolocation();

  useEffect(() => {
    let isMounted = true;
    setState("loading");

    fetchBarById(barId)
      .then((nextBar) => {
        if (!isMounted) {
          return;
        }

        setBar(nextBar);
        setState(nextBar ? "ready" : "not-found");
      })
      .catch(() => {
        if (isMounted) {
          setState("error");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [barId, reloadKey]);

  // Recalcula "aberto agora" a cada minuto.
  useEffect(() => {
    const timerId = window.setInterval(() => setNow(new Date()), 60 * 1000);
    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    if (bar) {
      document.title = bar.name;
    }
  }, [bar]);

  // Mesmo formato que o App entrega para a BarDetails.
  const detailedBar = useMemo(() => {
    if (!bar) {
      return null;
    }

    const openStatus = getOpenStatus(bar.hours, bar.isOpen, now);
    const distanceKm = hasLocation ? calculateDistanceKm(coordinates, bar) : null;

    return {
      ...bar,
      isOpen: openStatus.isOpen,
      openStatusDetail: openStatus.detail,
      isClosingSoon: openStatus.isClosingSoon,
      hasCoordinates: Number.isFinite(bar.latitude) && Number.isFinite(bar.longitude),
      hasRealDistance: Number.isFinite(distanceKm),
      distanceKm: Number.isFinite(distanceKm) ? distanceKm : bar.distanceKm
    };
  }, [bar, coordinates, hasLocation, now]);

  if (state === "loading") {
    return (
      <main className="details-page">
        <section className="empty-state" aria-live="polite">
          <h2>Carregando…</h2>
        </section>
      </main>
    );
  }

  if (state === "error") {
    return (
      <main className="details-page">
        <section className="empty-state" role="alert">
          <h2>Não conseguimos abrir esta página agora</h2>
          <p>Pode ser a conexão. Tente de novo em instantes.</p>
          <button
            className="primary-action"
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
          >
            Tentar de novo
          </button>
        </section>
      </main>
    );
  }

  if (state === "not-found") {
    return (
      <main className="details-page">
        <section className="empty-state">
          <h2>Página não encontrada</h2>
          <p>Confira o link ou o QR Code e tente de novo.</p>
        </section>
      </main>
    );
  }

  return (
    <BarDetails
      bar={detailedBar}
      isStandalone
      locationStatus={locationStatus}
      onRequestLocation={requestLocation}
    />
  );
}
