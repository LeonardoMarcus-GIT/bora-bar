import { useEffect, useMemo, useState } from "react";
import AppHeader from "./components/AppHeader.jsx";
import BarDetails from "./components/BarDetails.jsx";
import BarList from "./components/BarList.jsx";
import BottomNav from "./components/BottomNav.jsx";
import FilterBar from "./components/FilterBar.jsx";
import { mockBars } from "./data/mockBars.js";
import { getStartingPrice, normalizeText } from "./utils/format.js";

const FAVORITES_KEY = "bora-bar-favorites";

function getInitialBar() {
  const hashId = window.location.hash.replace("#bar/", "");
  return mockBars.find((bar) => bar.id === hashId) ?? null;
}

function readFavoriteIds() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY)) ?? [];
  } catch {
    return [];
  }
}

export default function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState([]);
  const [selectedBar, setSelectedBar] = useState(getInitialBar);
  const [favoriteIds, setFavoriteIds] = useState(readFavoriteIds);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    const onHashChange = () => setSelectedBar(getInitialBar());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteIds));
    } catch {
      // O app continua funcionando mesmo se o navegador bloquear o armazenamento local.
    }
  }, [favoriteIds]);

  const visibleBars = useMemo(() => {
    const normalizedSearch = normalizeText(searchTerm.trim());

    let bars = mockBars.filter((bar) => {
      const searchableText = normalizeText(
        `${bar.name} ${bar.neighborhood} ${bar.city}`
      );
      const matchesSearch =
        !normalizedSearch || searchableText.includes(normalizedSearch);
      const matchesOpen = !activeFilters.includes("open") || bar.isOpen;
      const matchesPromo =
        !activeFilters.includes("promo") || Boolean(bar.promotion);
      const matchesFavorite =
        !showFavoritesOnly || favoriteIds.includes(bar.id);

      return matchesSearch && matchesOpen && matchesPromo && matchesFavorite;
    });

    if (activeFilters.includes("cheap")) {
      bars = [...bars].sort((a, b) => getStartingPrice(a) - getStartingPrice(b));
    }

    if (activeFilters.includes("near")) {
      bars = [...bars].sort((a, b) => a.distanceKm - b.distanceKm);
    }

    return bars;
  }, [activeFilters, favoriteIds, searchTerm, showFavoritesOnly]);

  function toggleFavorite(barId) {
    setFavoriteIds((currentIds) =>
      currentIds.includes(barId)
        ? currentIds.filter((id) => id !== barId)
        : [...currentIds, barId]
    );
  }

  function toggleFilter(filterId) {
    setActiveFilters((currentFilters) =>
      currentFilters.includes(filterId)
        ? currentFilters.filter((item) => item !== filterId)
        : [...currentFilters, filterId]
    );
  }

  function selectBar(bar) {
    window.location.hash = `bar/${bar.id}`;
    setSelectedBar(bar);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    window.location.hash = "";
    setSelectedBar(null);
    setShowFavoritesOnly(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function focusSearch() {
    setShowFavoritesOnly(false);
    document.querySelector('[aria-label="Buscar por cidade ou bairro"]')?.focus();
  }

  function scrollToMenu() {
    document.querySelector(".menu-section")?.scrollIntoView({ behavior: "smooth" });
  }

  function showFavorites() {
    window.location.hash = "";
    setSelectedBar(null);
    setShowFavoritesOnly(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (selectedBar) {
    return (
      <>
        <BarDetails
          bar={selectedBar}
          isFavorite={favoriteIds.includes(selectedBar.id)}
          onBack={goBack}
          onToggleFavorite={toggleFavorite}
        />
        <BottomNav
          mode="menu"
          onHome={goBack}
          onSearch={goBack}
          onFavorites={showFavorites}
          onMenu={scrollToMenu}
        />
      </>
    );
  }

  return (
    <>
      <main className="home-page">
        <AppHeader
          resultCount={visibleBars.length}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
        <FilterBar activeFilters={activeFilters} onToggleFilter={toggleFilter} />
        <BarList
          bars={visibleBars}
          favoriteIds={favoriteIds}
          isFavoritesView={showFavoritesOnly}
          onSelectBar={selectBar}
          onToggleFavorite={toggleFavorite}
        />
      </main>
      <BottomNav
        mode={showFavoritesOnly ? "favorites" : "home"}
        onFavorites={showFavorites}
        onHome={goBack}
        onSearch={focusSearch}
      />
    </>
  );
}
