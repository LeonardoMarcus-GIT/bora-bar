import { useEffect, useMemo, useState } from "react";
import AppHeader from "./components/AppHeader.jsx";
import AuthPage from "./components/AuthPage.jsx";
import BarDetails from "./components/BarDetails.jsx";
import BarList from "./components/BarList.jsx";
import BottomNav from "./components/BottomNav.jsx";
import FilterBar from "./components/FilterBar.jsx";
import PasswordResetPage from "./components/PasswordResetPage.jsx";
import ProfilePage from "./components/ProfilePage.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { fetchBars } from "./services/barsService.js";
import { getStartingPrice, normalizeText } from "./utils/format.js";

const FAVORITES_KEY = "bora-bar-favorites";

function getRoute() {
  const hash = window.location.hash.replace("#", "");

  if (hash.startsWith("bar/")) {
    return { name: "bar", barId: hash.replace("bar/", "") };
  }

  if (hash.startsWith("profile")) {
    return { name: "profile" };
  }

  if (hash.startsWith("login")) {
    return { name: "login" };
  }

  if (hash.startsWith("reset-password") || hash.includes("type=recovery")) {
    return { name: "reset-password" };
  }

  return { name: "home" };
}

function readFavoriteIds() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY)) ?? [];
  } catch {
    return [];
  }
}

export default function App() {
  const { user } = useAuth();
  const [route, setRoute] = useState(getRoute);
  const [bars, setBars] = useState([]);
  const [isLoadingBars, setIsLoadingBars] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(readFavoriteIds);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    let isMounted = true;

    fetchBars().then((nextBars) => {
      if (isMounted) {
        setBars(nextBars);
        setIsLoadingBars(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const onHashChange = () => setRoute(getRoute());
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

  const selectedBarId = route.name === "bar" ? route.barId : "";

  const selectedBar = useMemo(
    () => bars.find((bar) => bar.id === selectedBarId) ?? null,
    [bars, selectedBarId]
  );

  const visibleBars = useMemo(() => {
    const normalizedSearch = normalizeText(searchTerm.trim());

    let nextBars = bars.filter((bar) => {
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
      nextBars = [...nextBars].sort(
        (a, b) => getStartingPrice(a) - getStartingPrice(b)
      );
    }

    if (activeFilters.includes("near")) {
      nextBars = [...nextBars].sort((a, b) => a.distanceKm - b.distanceKm);
    }

    return nextBars;
  }, [activeFilters, bars, favoriteIds, searchTerm, showFavoritesOnly]);

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
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    window.location.hash = "";
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
    setShowFavoritesOnly(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openProfile() {
    window.location.hash = user ? "profile" : "login";
    setShowFavoritesOnly(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (route.name === "reset-password") {
    return (
      <>
        <PasswordResetPage onDone={() => (window.location.hash = "profile")} />
        <BottomNav
          mode="profile"
          onFavorites={showFavorites}
          onHome={goBack}
          onProfile={openProfile}
          onSearch={goBack}
        />
      </>
    );
  }

  if (route.name === "login") {
    return (
      <>
        <AuthPage onAuthenticated={() => (window.location.hash = "profile")} />
        <BottomNav
          mode="profile"
          onFavorites={showFavorites}
          onHome={goBack}
          onProfile={openProfile}
          onSearch={goBack}
        />
      </>
    );
  }

  if (route.name === "profile") {
    return (
      <>
        <ProfilePage
          onLoginRequired={() => (window.location.hash = "login")}
          onSignedOut={() => (window.location.hash = "login")}
        />
        <BottomNav
          mode="profile"
          onFavorites={showFavorites}
          onHome={goBack}
          onProfile={openProfile}
          onSearch={goBack}
        />
      </>
    );
  }

  if (selectedBarId && !selectedBar && isLoadingBars) {
    return (
      <>
        <main className="details-page">
          <section className="empty-state">
            <h2>Carregando bar</h2>
            <p>Estamos buscando as informacoes desse lugar.</p>
          </section>
        </main>
        <BottomNav
          mode="menu"
          onHome={goBack}
          onProfile={openProfile}
          onSearch={goBack}
        />
      </>
    );
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
          onProfile={openProfile}
        />
      </>
    );
  }

  return (
    <>
      <main className="home-page">
        <AppHeader
          isLoading={isLoadingBars}
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
        onProfile={openProfile}
        onSearch={focusSearch}
      />
    </>
  );
}
