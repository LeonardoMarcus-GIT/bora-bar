import { BadgePercent, Heart, Music } from "lucide-react";
import StatusBadge from "./StatusBadge.jsx";
import { formatDistanceKm } from "../utils/geo.js";
import { formatCurrency, formatEventWhen, getStartingPrice } from "../utils/format.js";
import { barCard as t } from "../texts/app.js";

// Cartão da lista: foto à esquerda, status, nome, distância/bairro/preço e,
// em etiquetas, a promoção de hoje e o próximo evento.
export default function BarCard({ bar, isFavorite, onSelect, onToggleFavorite }) {
  const startingPrice = getStartingPrice(bar);
  const nextEvent = bar.events?.[0];
  const meta = [
    bar.hasCoordinates ? formatDistanceKm(bar.distanceKm) : null,
    bar.neighborhood || bar.city,
    bar.priceLevel,
    startingPrice ? `${t.since} ${formatCurrency(startingPrice)}` : null
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="bar-card" data-flip-id={bar.id}>
      <button
        className={`favorite-toggle ${isFavorite ? "is-favorite" : ""}`}
        type="button"
        onClick={() => onToggleFavorite(bar.id)}
        aria-label={`${isFavorite ? t.remove : t.favorite} ${bar.name}`}
        aria-pressed={isFavorite}
        title={isFavorite ? t.removeFromFavorites : t.favorite}
      >
        <Heart size={18} aria-hidden="true" />
      </button>
      <button
        className="bar-card-button"
        type="button"
        onClick={() => onSelect(bar)}
        aria-label={t.openDetails(bar.name)}
      >
        <div className="bar-card-media">
          <img className="bar-card-image" src={bar.image} alt="" loading="lazy" />
        </div>
        <div className="bar-card-body">
          <StatusBadge
            isOpen={bar.isOpen}
            isClosingSoon={bar.isClosingSoon}
            detail={bar.openStatusDetail}
          />
          <h2>{bar.name}</h2>
          <p className="bar-card-meta">{meta}</p>
          {bar.promotion && (
            <p className="bar-tag bar-tag-promo">
              <BadgePercent size={13} aria-hidden="true" />
              <span>{bar.promotion}</span>
            </p>
          )}
          {nextEvent && (
            <p className="bar-tag bar-tag-event">
              <Music size={13} aria-hidden="true" />
              <span>
                {nextEvent.title} · {formatEventWhen(nextEvent.startsAt)}
              </span>
            </p>
          )}
        </div>
      </button>
    </article>
  );
}
