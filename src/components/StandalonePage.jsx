import { useEffect, useMemo, useState } from "react";
import {
  BadgePercent,
  CalendarDays,
  Clock3,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Route,
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

function getRouteLinks(bar) {
  const hasCoordinates =
    Number.isFinite(bar.latitude) && Number.isFinite(bar.longitude);
  const destination = hasCoordinates
    ? `${bar.latitude},${bar.longitude}`
    : `${bar.address}, ${bar.city}`;

  return {
    google: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`,
    waze: hasCoordinates
      ? `https://www.waze.com/ul?ll=${encodeURIComponent(destination)}&navigate=yes`
      : `https://www.waze.com/ul?q=${encodeURIComponent(destination)}&navigate=yes`
  };
}

// Aparição suave dos blocos conforme a pessoa rola a página.
function useRevealOnScroll(dependency) {
  useEffect(() => {
    const elements = document.querySelectorAll("[data-reveal]:not(.is-revealed)");

    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-revealed"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [dependency]);
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

  useRevealOnScroll(bar);

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
  const routeLinks = getRouteLinks(bar);
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
        <section className="standalone-today" aria-label="Hoje" data-reveal>
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
        {phoneDigits ? (
          <a
            className="is-primary"
            href={`https://wa.me/${phoneDigits}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => track("whatsapp")}
          >
            <MessageCircle size={20} aria-hidden="true" />
            <span><strong>WhatsApp</strong><small>Falar com o restaurante</small></span>
          </a>
        ) : (
          <span className="is-primary is-unavailable" aria-disabled="true">
            <MessageCircle size={20} aria-hidden="true" />
            <span><strong>WhatsApp</strong><small>Em breve</small></span>
          </span>
        )}
        {phoneDigits ? (
          <a href={`tel:+${phoneDigits}`} onClick={() => track("phone")}>
            <Phone size={20} aria-hidden="true" />
            <span><strong>Ligar</strong><small>{bar.phone}</small></span>
          </a>
        ) : (
          <span className="is-unavailable" aria-disabled="true">
            <Phone size={20} aria-hidden="true" />
            <span><strong>Ligar</strong><small>Em breve</small></span>
          </span>
        )}
        <a
          href={routeLinks.google}
          target="_blank"
          rel="noreferrer"
          onClick={() => track("route_google")}
        >
          <Navigation size={20} aria-hidden="true" />
          <span><strong>Como chegar</strong><small>Google Maps</small></span>
        </a>
        <a
          href={routeLinks.waze}
          target="_blank"
          rel="noreferrer"
          onClick={() => track("route_waze")}
        >
          <Route size={20} aria-hidden="true" />
          <span><strong>Abrir no Waze</strong><small>Iniciar rota</small></span>
        </a>
      </section>

      {bar.gallery?.length > 0 && (
        <section className="standalone-dishes" aria-labelledby="pratos-do-dia">
          <div className="section-heading" data-reveal>
            <h2 id="pratos-do-dia">Pratos do dia</h2>
          </div>
          <div className="standalone-dishes-grid">
            {bar.gallery.map((dish, index) => (
              <article
                className="dish-card"
                key={`${dish.url}-${index}`}
                data-reveal
                style={{ "--reveal-delay": `${(index % 2) * 90}ms` }}
              >
                <div className="dish-card-photo">
                  <img src={dish.url} alt={dish.name || bar.name} loading="lazy" />
                </div>
                <div className="dish-card-body">
                  <div className="dish-card-title">
                    <h3>{dish.name}</h3>
                    {dish.price !== null && <strong>{formatCurrency(dish.price)}</strong>}
                  </div>
                  {dish.description && <p>{dish.description}</p>}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="menu-section standalone-menu" data-reveal>
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
        <section className="events-section" data-reveal>
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

      <section className="standalone-info" data-reveal>
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
