import { BadgePercent, ChevronRight, MapPin, WalletCards } from "lucide-react";
import StatusBadge from "./StatusBadge.jsx";
import { formatCurrency, getStartingPrice } from "../utils/format.js";

export default function BarCard({ bar, onSelect }) {
  return (
    <article className="bar-card">
      <button
        className="bar-card-button"
        type="button"
        onClick={() => onSelect(bar)}
        aria-label={`Abrir detalhes de ${bar.name}`}
      >
        <img className="bar-card-image" src={bar.image} alt={bar.name} />
        <div className="bar-card-body">
          <div className="bar-card-topline">
            <StatusBadge isOpen={bar.isOpen} />
            <span className="price-level">{bar.priceLevel}</span>
          </div>

          <h2>{bar.name}</h2>
          <p className="muted">
            {bar.neighborhood}, {bar.city}
          </p>

          <div className="bar-meta-grid">
            <span>
              <MapPin size={16} aria-hidden="true" />
              {bar.distanceKm.toFixed(1).replace(".", ",")} km
            </span>
            <span>
              <WalletCards size={16} aria-hidden="true" />
              A partir de {formatCurrency(getStartingPrice(bar))}
            </span>
          </div>

          {bar.promotion && (
            <p className="promo-pill">
              <BadgePercent size={16} aria-hidden="true" />
              {bar.promotion}
            </p>
          )}

          <span className="card-open-link">
            Ver detalhes
            <ChevronRight size={16} aria-hidden="true" />
          </span>
        </div>
      </button>
    </article>
  );
}
