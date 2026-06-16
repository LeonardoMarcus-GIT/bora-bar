import { BadgePercent, Heart, Home, Search, Utensils, UserRound } from "lucide-react";

export default function BottomNav({
  mode = "home",
  onFavorites,
  onHome,
  onMenu,
  onProfile,
  onPromotions,
  onSearch
}) {
  const isMenuMode = mode === "menu";
  const MiddleIcon = isMenuMode ? Utensils : BadgePercent;
  const middleLabel = isMenuMode ? "Cardapio" : "Promocoes";

  return (
    <nav className="bottom-nav" aria-label="Navegacao principal">
      <button
        className={mode === "home" ? "is-active" : ""}
        type="button"
        onClick={onHome}
        aria-label="Inicio"
        title="Inicio"
      >
        <Home size={20} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onSearch}
        aria-label="Buscar"
        title="Buscar"
      >
        <Search size={20} aria-hidden="true" />
      </button>
      {isMenuMode ? (
        <button
          className="is-active"
          type="button"
          onClick={onMenu}
          aria-label={middleLabel}
          title={middleLabel}
        >
          <MiddleIcon size={20} aria-hidden="true" />
        </button>
      ) : (
        <a
          className={mode === "promotions" ? "is-active" : ""}
          href="#promotions"
          onClick={onPromotions}
          aria-label={middleLabel}
          title={middleLabel}
        >
          <MiddleIcon size={20} aria-hidden="true" />
        </a>
      )}
      <button
        className={mode === "favorites" ? "is-active" : ""}
        type="button"
        onClick={onFavorites}
        aria-label="Favoritos"
        title="Favoritos"
      >
        <Heart size={20} aria-hidden="true" />
      </button>
      <button
        className={mode === "profile" ? "is-active" : ""}
        type="button"
        onClick={onProfile}
        aria-label="Perfil"
        title="Perfil"
      >
        <UserRound size={20} aria-hidden="true" />
      </button>
    </nav>
  );
}
