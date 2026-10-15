import { useEffect, useMemo, useState } from "react";
import {
  BadgePercent,
  CalendarDays,
  Clock3,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Sparkles
} from "lucide-react";
import MenuCategory from "./MenuCategory.jsx";
import StatusBadge from "./StatusBadge.jsx";
import {
  recordBarEvent,
  recordBarViewOnce
} from "../services/analyticsService.js";
import { fetchBarById } from "../services/barsService.js";
import { formatCurrency } from "../utils/format.js";
import { getOpenStatus } from "../utils/openingHours.js";

// Página avulsa do estabelecimento: /r/<id>.
// É o "site" do restaurante/bar para QR Code e link no Instagram.
// Sem a marca Bora Bar, sem login e sem a navegação do app.

const TIME_ZONE = "America/Sao_Paulo";

function getPhoneDigits(phone) {
  const digits = String(phone ?? "").replace(/\D/g, "");
  return digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
}

function getRouteUrl(bar) {
  const hasCoordinates =
    Number.isFinite(bar.latitude) && Number.isFinite(bar.longitude);
  const destination = hasCoordinates
    ? `${bar.latitude},${bar.longitude}`
    : `${bar.address}, ${bar.city}`;

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`;
}

function dayKey(date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(date);
}

function formatEventTime(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatEventDate(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIME_ZONE,
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export default function StandalonePage({ barId }) {
  const [bar, setBar] = useState(null);
  const [state, setState] = useState("loading");
  const [reloadKey, setReloadKey] = useState(0);
  const [now, setNow] = useState(() => new Date());

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

  useEffect(() => {
    const timerId = window.setInterval(() => setNow(new Date()), 60 * 1000);
    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    if (bar) {
      document.title = bar.name;
      void recordBarViewOnce(bar.id);
    }
  }, [bar]);

  const openStatus = useMemo(
    () => (bar ? getOpenStatus(bar.hours, bar.isOpen, now) : null),
    [bar, now]
  );

  const todayEvents = useMemo(() => {
    if (!bar?.events?.length) {
      return [];
    }

    const today = dayKey(now);
    return bar.events.filter((event) => dayKey(new Date(event.startsAt)) === today);
  }, [bar, now]);

  if (state === "loading") {
    return (
      <main className="standalone-page">
        <section className="empty-state" aria-live="polite">
          <h2>Carregando…</h2>
        </section>
      </main>
    );
  }

  if (state === "error") {
    return (
      <main className="standalone-page">
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
      <main className="standalone-page">
        <section className="empty-state">
          <h2>Página não encontrada</h2>
          <p>Confira o link ou o QR Code e tente de novo.</p>
        </section>
      </main>
    );
  }

  const phoneDigits = getPhoneDigits(bar.phone);
  const menuEntries = Object.entries(bar.menu ?? {}).filter(
    ([, items]) => items.length > 0
  );
  const hasToday = bar.promotions?.length > 0 || todayEvents.length > 0;
  const upcomingEvents = (bar.events ?? []).filter(
    (event) => !todayEvents.includes(event)
  );

  function track(eventType) {
    void recordBarEvent(bar.id, eventType);
  }

  return (
    <main className="standalone-page">
      <section className="details-hero standalone-hero">
        <img src={bar.image} alt={`Ambiente do ${bar.name}`} />
        <div className="details-hero-overlay">
          <StatusBadge isOpen={openStatus.isOpen} detail={openStatus.detail} />
          <h1>{bar.name}</h1>
          <p>
            {bar.neighborhood}, {bar.city}
          </p>
        </div>
      </section>

      {hasToday && (
        <section className="standalone-today" aria-label="Hoje">
          <p className="section-kicker">
            <Sparkles size={15} aria-hidden="true" /> Hoje
          </p>
          <ul>
            {bar.promotions.map((promotion) => (
              <li key={promotion.id}>
                <BadgePercent size={18} aria-hidden="true" />
                <span>
                  <strong>{promotion.title}</strong>
                  {promotion.description && <small>{promotion.description}</small>}
                </span>
              </li>
            ))}
            {todayEvents.map((event) => (
              <li key={event.id}>
                <CalendarDays size={18} aria-hidden="true" />
                <span>
                  <strong>
                    {event.title} · {formatEventTime(event.startsAt)}
                  </strong>
                  {(event.description || event.price !== null) && (
                    <small>
                      {event.description}
                      {event.description && event.price !== null ? " · " : ""}
                      {event.price !== null &&
                        (event.price > 0
                          ? `Entrada ${formatCurrency(event.price)}`
                          : "Entrada grátis")}
                    </small>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="details-quick-actions standalone-actions" aria-label="Contato">
        {phoneDigits && (
          <a
            className="is-primary"
            href={`https://wa.me/${phoneDigits}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => track("whatsapp")}
          >
            <MessageCircle size={20} aria-hidden="true" />
            <span><strong>WhatsApp</strong><small>Fazer pedido ou tirar dúvida</small></span>
          </a>
        )}
        {phoneDigits && (
          <a href={`tel:+${phoneDigits}`} onClick={() => track("phone")}>
            <Phone size={20} aria-hidden="true" />
            <span><strong>Ligar</strong><small>{bar.phone}</small></span>
          </a>
        )}
        <a
          href={getRouteUrl(bar)}
          target="_blank"
          rel="noreferrer"
          onClick={() => track("route_google")}
        >
          <Navigation size={20} aria-hidden="true" />
          <span><strong>Como chegar</strong><small>Abrir no mapa</small></span>
        </a>
      </section>

      <section className="menu-section standalone-menu">
        <div className="section-heading">
          <h2>Cardápio</h2>
        </div>
        {menuEntries.length ? (
          <div className="menu-grid">
            {menuEntries.map(([category, items]) => (
              <MenuCategory key={category} name={category} items={items} />
            ))}
          </div>
        ) : (
          <p className="description">Cardápio em atualização. Chame no WhatsApp para saber as opções de hoje.</p>
        )}
      </section>

      {upcomingEvents.length > 0 && (
        <section className="events-section">
          <div className="section-heading">
            <h2>Próximos eventos</h2>
          </div>
          <div className="event-grid">
            {upcomingEvents.map((event) => (
              <article className="event-card" key={event.id}>
                <CalendarDays size={22} aria-hidden="true" />
                <div>
                  <strong>{event.title}</strong>
                  <span>{formatEventDate(event.startsAt)}</span>
                  {event.description && <p>{event.description}</p>}
                  {event.price !== null && (
                    <small>
                      {event.price > 0 ? `Entrada: ${formatCurrency(event.price)}` : "Entrada grátis"}
                    </small>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="standalone-info">
        {bar.description && <p className="description">{bar.description}</p>}
        <div className="info-list">
          <p>
            <Clock3 size={18} aria-hidden="true" />
            <span><strong>Funcionamento</strong><small>{bar.hours}</small></span>
          </p>
          <p>
            <MapPin size={18} aria-hidden="true" />
            <span><strong>Endereço</strong><small>{bar.address}</small></span>
          </p>
        </div>
      </section>
    </main>
  );
}
