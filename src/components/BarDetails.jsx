import {
  ArrowLeft,
  BadgePercent,
  CalendarDays,
  Clock3,
  Heart,
  MapPin,
  MessageCircle,
  Phone
} from "lucide-react";
import MenuCategory from "./MenuCategory.jsx";
import Reviews from "./Reviews.jsx";
import StatusBadge from "./StatusBadge.jsx";
import { formatCurrency } from "../utils/format.js";
import { formatDistanceKm } from "../utils/geo.js";

function formatEventDate(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default function BarDetails({
  bar,
  isFavorite,
  onBack,
  onToggleFavorite
}) {
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
        <img src={bar.image} alt={bar.name} />
        <div className="details-hero-overlay">
          <StatusBadge isOpen={bar.isOpen} />
          <h1>{bar.name}</h1>
          <p>
            {bar.neighborhood}, {bar.city}
          </p>
        </div>
      </section>

      <section className="details-content">
        <div className="details-main">
          <div className="section-heading">
            <h2>Informações</h2>
            <span>{bar.priceLevel}</span>
          </div>
          <p className="description">{bar.description}</p>

          <div className="info-list">
            <p>
              <MapPin size={18} aria-hidden="true" />
              {bar.address}
            </p>
            <p>
              <Clock3 size={18} aria-hidden="true" />
              {bar.hours}
            </p>
            <p>
              <Phone size={18} aria-hidden="true" />
              {bar.phone}
            </p>
            <a href={`https://wa.me/55${bar.phone.replace(/\D/g, "")}`}>
              <MessageCircle size={18} aria-hidden="true" />
              WhatsApp
            </a>
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
          <h2>Resumo</h2>
          <dl>
            <div>
              <dt>Distância</dt>
              <dd>
                {bar.hasCoordinates
                  ? formatDistanceKm(bar.distanceKm)
                  : "Indisponivel"}
              </dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{bar.isOpen ? "Aberto agora" : "Fechado no momento"}</dd>
            </div>
            <div>
              <dt>Preço</dt>
              <dd>{bar.priceLevel}</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="menu-section">
        <div className="section-heading">
          <h2>Cardápio</h2>
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
            <h2>Proximos eventos</h2>
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
