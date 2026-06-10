import { Heart, Home, Search, Utensils, UserRound } from "lucide-react";

export default function BottomNav({
  mode = "home",
  onFavorites,
  onHome,
  onMenu,
  onProfile,
  onSearch
}) {
  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      <button
        className={mode === "home" ? "is-active" : ""}
        type="button"
        onClick={onHome}
        aria-label="Início"
        title="Início"
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
      <button
        className={mode === "menu" ? "is-active" : ""}
        type="button"
        onClick={onMenu}
        aria-label="Cardápio"
        title="Cardápio"
      >
        <Utensils size={20} aria-hidden="true" />
      </button>
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
