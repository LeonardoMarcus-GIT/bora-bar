import { BadgePercent, Music } from "lucide-react";
import { formatDistanceKm } from "../utils/geo.js";
import { nearby as t } from "../texts/app.js";

// Faixa compacta "Perto de você": cartões pequenos que rolam para o lado,
// acima da lista completa. Mostra até 6 lugares.
export default function NearbyStrip({ bars, hasLocation, onSelectBar }) {
  if (bars.length < 2) return null;

  return (
    <section className="nearby-strip" aria-label={hasLocation ? t.title : t.titleNoLocation}>
      <h2 className="home-section-title">
        {hasLocation ? t.title : t.titleNoLocation} <span>{bars.length}</span>
      </h2>
      <div className="nearby-track">
        {bars.slice(0, 6).map((bar) => {
          const highlight = bar.promotion || bar.events?.[0]?.title;
          const HighlightIcon = bar.promotion ? BadgePercent : Music;

          return (
            <button className="nearby-card" type="button" key={bar.id} onClick={() => onSelectBar(bar)}>
              <img src={bar.image} alt="" loading="lazy" />
              <span className="nearby-card-text">
                <strong>{bar.name}</strong>
                <small>
                  {[bar.hasCoordinates ? formatDistanceKm(bar.distanceKm) : null, bar.neighborhood]
                    .filter(Boolean)
                    .join(" · ")}
                </small>
                {highlight && (
                  <em>
                    <HighlightIcon size={11} aria-hidden="true" />
                    {highlight}
                  </em>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
