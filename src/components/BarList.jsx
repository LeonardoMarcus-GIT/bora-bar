import { useRef } from "react";
import BarCard from "./BarCard.jsx";
import { useFlip } from "../hooks/useFlip.js";
import { barList as t } from "../texts/app.js";

export default function BarList({
  bars,
  favoriteIds,
  isFavoritesView,
  onSelectBar,
  onToggleFavorite
}) {
  const gridRef = useRef(null);
  useFlip(gridRef, bars.map((bar) => bar.id).join(","));

  if (!bars.length) {
    return (
      <section className="empty-state">
        <h2>{isFavoritesView ? t.noFavoritesTitle : t.noBarsTitle}</h2>
        <p>{isFavoritesView ? t.noFavoritesCopy : t.noBarsCopy}</p>
      </section>
    );
  }

  return (
    <section className="bar-grid" aria-label={t.ariaLabel} ref={gridRef}>
      {bars.map((bar) => (
        <BarCard
          bar={bar}
          isFavorite={favoriteIds.includes(bar.id)}
          key={bar.id}
          onSelect={onSelectBar}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </section>
  );
}
