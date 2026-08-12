import { useEffect } from "react";
import {
  ArrowLeft,
  BadgePercent,
  CalendarDays,
  Clock3,
  Heart,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Route
} from "lucide-react";
import MenuCategory from "./MenuCategory.jsx";
import Reviews from "./Reviews.jsx";
import StatusBadge from "./StatusBadge.jsx";
import {
  recordBarEvent,
  recordBarViewOnce
} from "../services/analyticsService.js";
import { formatCurrency } from "../utils/format.js";
import { formatDistanceKm } from "../utils/geo.js";

function formatEventDate(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

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

export default function BarDetails({
  bar,
  isFavorite,
  onBack,
  onToggleFavorite
}) {
  const phoneDigits = getPhoneDigits(bar.phone);
  const routeLinks = getRouteLinks(bar);

  useEffect(() => {
    void recordBarViewOnce(bar.id);
  }, [bar.id]);

  function track(eventType) {
    void recordBarEvent(bar.id, eventType);
  }

  return (
    <main className="details-page">
      <div className="details-actions">
        <button className="back-button" type="button" onClick={onBack}>
          <ArrowLeft size={18} aria-hidden="true" />
          Voltar
        </button>
        <button
          className={`detail-favorite ${isFavorite ? "is-favorite" : ""}`}
          type="button"
          onClick={() => onToggleFavorite(bar.id)}
          aria-label={`${isFavorite ? "Remover" : "Favoritar"} ${bar.name}`}
          aria-pressed={isFavorite}
          title={isFavorite ? "Remover dos favoritos" : "Favoritar"}
        >
          <Heart size={19} aria-hidden="true" />
          {isFavorite ? "Favorito" : "Favoritar"}
        </button>
      </div>

      <section className="details-hero">
        <img src={bar.image} alt={`Ambiente do ${bar.name}`} />
        <div className="details-hero-overlay">
          <StatusBadge isOpen={bar.isOpen} />
          <h1>{bar.name}</h1>
          <p>
            {bar.neighborhood}, {bar.city}
          </p>
          <div className="details-hero-facts">
            <span>{bar.priceLevel}</span>
            <span>
              {bar.hasCoordinates
                ? formatDistanceKm(bar.distanceKm)
                : "Distância indisponível"}
            </span>
          </div>
        </div>
      </section>

      <section className="details-quick-actions" aria-label="Ações do estabelecimento">
        <a
          className="is-primary"
          href={`https://wa.me/${phoneDigits}`}
          target="_blank"
          rel="noreferrer"
          onClick={() => track("whatsapp")}
        >
          <MessageCircle size={20} aria-hidden="true" />
          <span><strong>WhatsApp</strong><small>Falar com o bar</small></span>
        </a>
        <a href={`tel:${phoneDigits}`} onClick={() => track("phone")}>
          <Phone size={20} aria-hidden="true" />
          <span><strong>Ligar</strong><small>{bar.phone}</small></span>
        </a>
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

      <section className="details-content">
        <div className="details-main">
          <div className="section-heading">
            <h2>Sobre o lugar</h2>
            <span>{bar.priceLevel}</span>
          </div>
          <p className="description">{bar.description}</p>

          <div className="info-list">
            <p>
              <MapPin size={18} aria-hidden="true" />
              <span><strong>Endereço</strong><small>{bar.address}</small></span>
            </p>
            <p>
              <Clock3 size={18} aria-hidden="true" />
              <span><strong>Funcionamento</strong><small>{bar.hours}</small></span>
            </p>
            <p>
              <Phone size={18} aria-hidden="true" />
              <span><strong>Contato</strong><small>{bar.phone}</small></span>
            </p>
          </div>

          {bar.promotions?.length ? (
            <div className="public-feature-list">
              {bar.promotions.map((promotion) => (
                <div className="promo-box" key={promotion.id}>
                  <BadgePercent size={20} aria-hidden="true" />
                  <span>
                    <strong>{promotion.title}</strong>
                    {promotion.description && <small>{promotion.description}</small>}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            bar.promotion && (
              <div className="promo-box">
                <BadgePercent size={20} aria-hidden="true" />
                <span>{bar.promotion}</span>
              </div>
            )
          )}
        </div>

        <aside className="details-side">
          <p className="section-kicker">Antes de sair</p>
          <h2>Resumo rápido</h2>
          <dl>
            <div>
              <dt>Distância</dt>
              <dd>
                {bar.hasCoordinates
                  ? formatDistanceKm(bar.distanceKm)
                  : "Indisponível"}
              </dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{bar.isOpen ? "Aberto agora" : "Fechado no momento"}</dd>
            </div>
            <div>
              <dt>Faixa de preço</dt>
              <dd>{bar.priceLevel}</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="menu-section">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Confira antes de pedir</p>
            <h2>Cardápio</h2>
          </div>
          <span>{Object.values(bar.menu).flat().length} itens</span>
        </div>
        <div className="menu-grid">
          {Object.entries(bar.menu).map(([category, items]) => (
            <MenuCategory key={category} name={category} items={items} />
          ))}
        </div>
      </section>

      {bar.events?.length > 0 && (
        <section className="events-section">
          <div className="section-heading">
            <h2>Próximos eventos</h2>
            <span>{bar.events.length}</span>
          </div>
          <div className="event-grid">
            {bar.events.map((event) => (
              <article className="event-card" key={event.id}>
                <CalendarDays size={22} aria-hidden="true" />
                <div>
                  <strong>{event.title}</strong>
                  <span>{formatEventDate(event.startsAt)}</span>
                  {event.description && <p>{event.description}</p>}
                  {event.price !== null && (
                    <small>Entrada: {formatCurrency(event.price)}</small>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <Reviews barId={bar.id} />
    </main>
  );
}
