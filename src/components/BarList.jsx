import BarCard from "./BarCard.jsx";

export default function BarList({
  bars,
  favoriteIds,
  isFavoritesView,
  onSelectBar,
  onToggleFavorite
}) {
  if (!bars.length) {
    return (
      <section className="empty-state">
        <h2>{isFavoritesView ? "Nenhum favorito ainda" : "Nenhum bar encontrado"}</h2>
        <p>
          {isFavoritesView
            ? "Toque no coração de um bar para salvar aqui."
            : "Tente outro bairro, cidade ou remova algum filtro."}
        </p>
      </section>
    );
  }

  return (
    <section className="bar-grid" aria-label="Lista de bares">
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
