import { BadgePercent, Heart } from "lucide-react";
import StatusBadge from "./StatusBadge.jsx";
import { formatDistanceKm } from "../utils/geo.js";
import { formatCurrency, getStartingPrice } from "../utils/format.js";
import { barCard as t } from "../texts/app.js";

export default function BarCard({ bar, isFavorite, onSelect, onToggleFavorite }) {
  const place = [bar.neighborhood, bar.hasCoordinates ? formatDistanceKm(bar.distanceKm) : bar.city]
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
        <Heart size={19} aria-hidden="true" />
      </button>
      <button
        className="bar-card-button"
        type="button"
        onClick={() => onSelect(bar)}
        aria-label={t.openDetails(bar.name)}
      >
        <div className="bar-card-media">
          <img className="bar-card-image" src={bar.image} alt={bar.name} />
        </div>
        <div className="bar-card-body">
          <StatusBadge
            isOpen={bar.isOpen}
            isClosingSoon={bar.isClosingSoon}
            detail={bar.openStatusDetail}
          />
          <h2>{bar.name}</h2>
          <p className="muted">{place}</p>
          <p className="bar-card-price">
            <span className="price-level">{bar.priceLevel}</span>
            {t.startingAt} {formatCurrency(getStartingPrice(bar))}
          </p>
          {bar.promotion && (
            <p className="promo-pill">
              <BadgePercent size={15} aria-hidden="true" />
              {bar.promotion}
            </p>
          )}
        </div>
      </button>
    </article>
  );
}
