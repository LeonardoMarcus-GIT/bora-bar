import { useEffect, useMemo, useRef, useState } from "react";
import AppHeader from "./components/AppHeader.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import BarDetails from "./pages/BarDetails.jsx";
import BarList from "./components/BarList.jsx";
import BarStories from "./components/BarStories.jsx";
import BottomNav from "./components/BottomNav.jsx";
import BusinessDashboard from "./pages/BusinessDashboard.jsx";
import FilterBar from "./components/FilterBar.jsx";
import ForBusinessPage from "./pages/ForBusinessPage.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import NearbyStrip from "./components/NearbyStrip.jsx";
import PasswordResetPage from "./pages/PasswordResetPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import PromotionsPage from "./pages/PromotionsPage.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { useGeolocation } from "./hooks/useGeolocation.js";
import { recordBarEvent } from "./services/analyticsService.js";
import { fetchProfile } from "./services/profilesService.js";
import { fetchBars } from "./services/barsService.js";
import { calculateDistanceKm } from "./utils/geo.js";
import { getOpenStatus } from "./utils/openingHours.js";
import { barMatchesVibe, getVibe } from "./utils/vibes.js";
import { getStartingPrice, normalizeText } from "./utils/format.js";
import { home as t, nearby as nearbyText } from "./texts/app.js";
import { transitionRoute } from "./utils/viewTransition.js";

const FAVORITES_KEY = "bora-bar-favorites";
const MAX_DISCOVERY_DISTANCE_KM = 20;

function isWithinDiscoveryRange(bar) {
  return !bar.hasRealDistance || bar.distanceKm <= MAX_DISCOVERY_DISTANCE_KM;
}

function getRoute() {
  const hash = window.location.hash.replace("#", "");
  const params = new URLSearchParams(window.location.search);

  if (
    params.get("auth") === "recovery" ||
    params.get("type") === "recovery" ||
    hash.startsWith("reset-password") ||
    hash.includes("type=recovery")
  ) {
    return { name: "reset-password" };
  }

  if (hash.startsWith("bar/")) {
    return { name: "bar", barId: hash.replace("bar/", "") };
  }

  if (hash.startsWith("profile")) {
    return { name: "profile" };
  }

  if (hash.startsWith("business")) {
    return { name: "business" };
  }

  if (hash.startsWith("for-business")) {
    return { name: "for-business" };
  }

  if (hash.startsWith("login")) {
    return { name: "login" };
  }

  // #clima/<id>: lista filtrada pelo clima (vindo de "Qual é o rolê de hoje?").
  if (hash.startsWith("clima/")) {
    return { name: "home", vibe: hash.replace("clima/", "") };
  }

  // "#promotions": promoções de hoje + agenda (PromotionsPage).
  if (hash.startsWith("promotions")) {
    return { name: "promotions" };
  }

  if (hash.startsWith("app")) {
    return { name: "home" };
  }

  return { name: "landing" };
}

function readFavoriteIds() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY)) ?? [];
  } catch {
    return [];
  }
}

function readAuthRedirect() {
  try {
    return sessionStorage.getItem("bora-bar-auth-redirect") ?? "";
  } catch {
    return "";
  }
}

function saveAuthRedirect(routeName) {
  try {
    sessionStorage.setItem("bora-bar-auth-redirect", routeName);
  } catch {
    // O login continua funcionando mesmo se o navegador bloquear sessionStorage.
  }
}

function clearAuthRedirect() {
  try {
    sessionStorage.removeItem("bora-bar-auth-redirect");
  } catch {
    // Não há estado obrigatório para limpar.
  }
}

function getProfileLocation(profile = {}, metadata = {}) {
  const latitude = getCoordinate(profile.latitude ?? metadata.latitude);
  const longitude = getCoordinate(profile.longitude ?? metadata.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  if (latitude === 0 && longitude === 0) {
    return null;
  }

  const source =
    profile.locationSource ??
    profile.location_source ??
    metadata.location_source ??
    metadata.locationSource;

  if (source !== "profile_address_verified") {
    return null;
  }

  return {
    latitude,
    longitude,
    source
  };
}

function getCoordinate(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

export default function App() {
  const { user } = useAuth();
  const [route, setRoute] = useState(getRoute);
  // Rota atual para a transição entre telas (o listener de hashchange é criado uma vez só).
  const routeRef = useRef(route);
  routeRef.current = route;
  const [bars, setBars] = useState([]);
  const [isLoadingBars, setIsLoadingBars] = useState(true);
  const [barsLoadError, setBarsLoadError] = useState(false);
  const [barsReloadKey, setBarsReloadKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(readFavoriteIds);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [profileLocation, setProfileLocation] = useState(null);
  // Relógio do app: recalcula "aberto agora" a cada minuto sem recarregar a página.
  const [now, setNow] = useState(() => new Date());
  const {
    coordinates: userLocation,
    hasLocation,
    requestLocation,
    status: locationStatus
  } = useGeolocation();

  useEffect(() => {
    let isMounted = true;

    setIsLoadingBars(true);
    setBarsLoadError(false);

    fetchBars()
      .then((nextBars) => {
        if (isMounted) {
          setBars(nextBars);
        }
      })
      .catch(() => {
        // Nunca mostrar bares de exemplo no lugar dos reais: mostramos o erro.
        if (isMounted) {
          setBarsLoadError(true);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingBars(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [barsReloadKey]);

  useEffect(() => {
    const timerId = window.setInterval(() => setNow(new Date()), 60 * 1000);
    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      const nextRoute = getRoute();
      transitionRoute(() => setRoute(nextRoute), routeRef.current, nextRoute);
    };

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

  useEffect(() => {
    let isMounted = true;

    if (!user) {
      setProfileLocation(null);
      return () => {
        isMounted = false;
      };
    }

    fetchProfile(user.id)
      .then((profile) => {
        if (!isMounted) {
          return;
        }

        setProfileLocation(getProfileLocation(profile, user.user_metadata));
      })
      .catch(() => {
        if (isMounted) {
          setProfileLocation(getProfileLocation({}, user.user_metadata));
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    const onProfileUpdated = (event) => {
      setProfileLocation(getProfileLocation(event.detail?.profile));
    };

    window.addEventListener("bora-bar-profile-updated", onProfileUpdated);
    return () => {
      window.removeEventListener("bora-bar-profile-updated", onProfileUpdated);
    };
  }, []);

  const selectedBarId = route.name === "bar" ? route.barId : "";
  const activeVibe = route.name === "home" && route.vibe ? getVibe(route.vibe) : null;
  const activeVibeId = activeVibe?.id ?? "";
  const activeLocation = hasLocation ? userLocation : profileLocation;
  const hasDistanceLocation = Boolean(activeLocation);
  const isUsingProfileLocation = !hasLocation && Boolean(profileLocation);

  const barsWithDistance = useMemo(
    () =>
      bars.map((bar) => {
        const calculatedDistanceKm = hasDistanceLocation
          ? calculateDistanceKm(activeLocation, bar)
          : null;
        const openStatus = getOpenStatus(bar.hours, bar.isOpen, now);

        return {
          ...bar,
          isOpen: openStatus.isOpen,
          openStatusDetail: openStatus.detail,
          isClosingSoon: openStatus.isClosingSoon,
          distanceKm: calculatedDistanceKm ?? bar.distanceKm,
          hasCoordinates:
            Number.isFinite(bar.latitude) && Number.isFinite(bar.longitude),
          hasRealDistance: Number.isFinite(calculatedDistanceKm)
        };
      }),
    [activeLocation, bars, hasDistanceLocation, now]
  );

  const selectedBar = useMemo(
    () => barsWithDistance.find((bar) => bar.id === selectedBarId) ?? null,
    [barsWithDistance, selectedBarId]
  );

  const searchSuggestions = useMemo(() => {
    const suggestions = new Map();

    function addSuggestion({ type, value, label, city, bar }) {
      const normalizedValue = normalizeText(value);

      if (!normalizedValue) {
        return;
      }

      const key = `${type}-${normalizedValue}-${type === "neighborhood" ? normalizeText(city) : ""}`;
      const existingSuggestion = suggestions.get(key);
      const distanceKm = bar.hasRealDistance ? bar.distanceKm : null;
      const nextSuggestion = existingSuggestion ?? {
        type,
        value,
        label,
        city,
        bar,
        count: 0,
        distanceKm: null
      };

      nextSuggestion.count += 1;

      if (
        Number.isFinite(distanceKm) &&
        (!Number.isFinite(nextSuggestion.distanceKm) || distanceKm < nextSuggestion.distanceKm)
      ) {
        nextSuggestion.distanceKm = distanceKm;
      }

      suggestions.set(key, nextSuggestion);
    }

    barsWithDistance.forEach((bar) => {
      if (!isWithinDiscoveryRange(bar)) {
        return;
      }

      addSuggestion({
        type: "bar",
        value: bar.name,
        label: bar.name,
        city: bar.city,
        bar
      });

      addSuggestion({
        type: "neighborhood",
        value: bar.neighborhood,
        label: bar.neighborhood,
        city: bar.city,
        bar
      });

      addSuggestion({
        type: "city",
        value: bar.city,
        label: bar.city,
        city: bar.city,
        bar
      });
    });

    return [...suggestions.values()]
      .map((suggestion) => {
        const typeLabel = t.suggestionType[suggestion.type];
        const countLabel = t.barCount(suggestion.count);

        return {
          ...suggestion,
          typeLabel,
          detail:
            suggestion.type === "bar"
              ? `${suggestion.city} - ${suggestion.bar.neighborhood}`
              : suggestion.type === "city"
              ? `${typeLabel} • ${countLabel}`
              : `${t.suggestionInCity(typeLabel, suggestion.city)} • ${countLabel}`
        };
      })
      .sort((a, b) => {
        if (hasDistanceLocation) {
          const distanceA = Number.isFinite(a.distanceKm) ? a.distanceKm : Infinity;
          const distanceB = Number.isFinite(b.distanceKm) ? b.distanceKm : Infinity;

          if (distanceA !== distanceB) {
            return distanceA - distanceB;
          }
        }

        if (a.type !== b.type) {
          const typeOrder = { bar: 0, neighborhood: 1, city: 2 };
          return typeOrder[a.type] - typeOrder[b.type];
        }

        return a.label.localeCompare(b.label, "pt-BR");
      });
  }, [barsWithDistance, hasDistanceLocation]);

  const visibleBars = useMemo(() => {
    const normalizedSearch = normalizeText(searchTerm.trim());

    let nextBars = barsWithDistance.filter((bar) => {
      const searchableText = normalizeText(
        `${bar.name} ${bar.neighborhood} ${bar.city}`
      );
      const matchesSearch =
        !normalizedSearch || searchableText.includes(normalizedSearch);
      const matchesOpen = !activeFilters.includes("open") || bar.isOpen;
      const matchesPromo =
        !activeFilters.includes("promo") || Boolean(bar.promotion);
      const matchesVibe = barMatchesVibe(bar, activeVibeId);
      const matchesFavorite =
        !showFavoritesOnly || favoriteIds.includes(bar.id);
      return (
        matchesSearch &&
        matchesOpen &&
        matchesPromo &&
        matchesFavorite &&
        matchesVibe &&
        isWithinDiscoveryRange(bar)
      );
    });

    if (activeFilters.includes("cheap")) {
      nextBars = [...nextBars].sort(
        (a, b) => getStartingPrice(a) - getStartingPrice(b)
      );
    }

    if (!activeFilters.includes("cheap") && hasDistanceLocation) {
      nextBars = [...nextBars].sort((a, b) => a.distanceKm - b.distanceKm);
    }

    return nextBars;
  }, [
    activeFilters,
    barsWithDistance,
    favoriteIds,
    hasDistanceLocation,
    searchTerm,
    showFavoritesOnly,
    activeVibeId
  ]);

  // Stories e "Perto de você" só aparecem na lista geral, sem busca nem favoritos.
  const isBrowsingAll = !searchTerm.trim() && !showFavoritesOnly;
  const showStories = isBrowsingAll && !activeVibe && !isLoadingBars && !barsLoadError;
  const showNearby = isBrowsingAll && !activeVibe && visibleBars.length > 3;

  function toggleFavorite(barId) {
    if (!favoriteIds.includes(barId)) {
      void recordBarEvent(barId, "favorite");
    }

    setFavoriteIds((currentIds) =>
      currentIds.includes(barId)
        ? currentIds.filter((id) => id !== barId)
        : [...currentIds, barId]
    );
  }

  function toggleFilter(filterId) {
    if (filterId === "near" && !hasDistanceLocation) {
      requestLocation();
    }

    setActiveFilters((currentFilters) =>
      currentFilters.includes(filterId)
        ? currentFilters.filter((item) => item !== filterId)
        : [...currentFilters, filterId]
    );
  }

  function selectSearchSuggestion(suggestion) {
    if (suggestion.type === "bar") {
      selectBar(suggestion.bar);
      return;
    }

    setSearchTerm(suggestion.value);
    setShowFavoritesOnly(false);
    setActiveFilters((currentFilters) =>
      currentFilters.includes("near") ? currentFilters : [...currentFilters, "near"]
    );

    if (!hasDistanceLocation && locationStatus !== "loading") {
      requestLocation();
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function selectBar(bar) {
    window.location.hash = `bar/${bar.id}`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    window.location.hash = "app";
    setShowFavoritesOnly(false);
    setActiveFilters([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Botão da lupa: vai para a lista (se estiver em outra tela), sobe ao topo e deixa a busca pronta para digitar.
  function openSearch() {
    setShowFavoritesOnly(false);

    if (route.name !== "home") {
      window.location.hash = "app";
      setActiveFilters([]);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
    window.setTimeout(() => {
      document.querySelector(".search-box input")?.focus({ preventScroll: true });
    }, 400);
  }

  function scrollToMenu() {
    document.querySelector(".menu-section")?.scrollIntoView({ behavior: "smooth" });
  }

  function showFavorites() {
    window.location.hash = "app";
    setShowFavoritesOnly(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showPromotions() {
    window.location.hash = "promotions";
    setShowFavoritesOnly(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openProfile() {
    window.location.hash = user ? "profile" : "login";
    setShowFavoritesOnly(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openBusiness() {
    if (!user) {
      saveAuthRedirect("business");
      window.location.hash = "login";
      return;
    }

    window.location.hash = "business";
    setShowFavoritesOnly(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openForBusiness() {
    window.location.hash = "for-business";
    setShowFavoritesOnly(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function previewManagedBar(barId) {
    // Abre a página avulsa (/r/<id>), que funciona mesmo para quem não aparece no guia.
    window.open(`/r/${encodeURIComponent(barId)}`, "_blank", "noopener");
  }

  function handleAuthenticated() {
    const redirect = readAuthRedirect();
    clearAuthRedirect();

    if (redirect === "business") {
      window.location.hash = "business";
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    goBack();
  }

  async function refreshBars() {
    try {
      const nextBars = await fetchBars();
      setBars(nextBars);
      setBarsLoadError(false);
    } catch {
      // Mantém a lista atual; o painel já avisou se o salvamento falhou.
    }
  }

  function retryLoadBars() {
    setBarsReloadKey((key) => key + 1);
  }

  if (route.name === "landing") {
    return (
      <LandingPage
        onExplore={goBack}
        onCreateAccount={() => {
          window.location.hash = "login";
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onAuthenticated={goBack}
      />
    );
  }

  if (route.name === "reset-password") {
    return (
      <>
        <PasswordResetPage
          onBackToLogin={() => {
            window.history.replaceState({}, "", "/#login");
            setRoute({ name: "login" });
          }}
          onDone={() => {
            window.history.replaceState({}, "", "/#profile");
            setRoute({ name: "profile" });
          }}
        />
        <BottomNav
          mode="profile"
          onFavorites={showFavorites}
          onHome={goBack}
          onProfile={openProfile}
          onPromotions={showPromotions}
          onSearch={openSearch}
        />
      </>
    );
  }

  if (route.name === "login") {
    return (
      <>
        <AuthPage
          onAuthenticated={handleAuthenticated}
          onBackToLanding={() => {
            window.location.hash = "";
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
        <BottomNav
          mode="profile"
          onFavorites={showFavorites}
          onHome={goBack}
          onProfile={openProfile}
          onPromotions={showPromotions}
          onSearch={openSearch}
        />
      </>
    );
  }

  if (route.name === "profile") {
    return (
      <>
        <ProfilePage
          onLoginRequired={() => (window.location.hash = "login")}
          onManageBusiness={openBusiness}
          onOpenForBusiness={openForBusiness}
          onSaved={goBack}
          onSignedOut={() => (window.location.hash = "login")}
        />
        <BottomNav
          mode="profile"
          onFavorites={showFavorites}
          onHome={goBack}
          onProfile={openProfile}
          onPromotions={showPromotions}
          onSearch={openSearch}
        />
      </>
    );
  }

  if (route.name === "for-business") {
    return (
      <>
        <ForBusinessPage onBack={goBack} onGetStarted={openBusiness} />
        <BottomNav
          mode="profile"
          onFavorites={showFavorites}
          onHome={goBack}
          onProfile={openProfile}
          onPromotions={showPromotions}
          onSearch={openSearch}
        />
      </>
    );
  }

  if (route.name === "business") {
    return (
      <>
        <BusinessDashboard
          bars={bars}
          onBack={goBack}
          onDataChanged={refreshBars}
          onPreviewBar={previewManagedBar}
          onLoginRequired={() => {
            saveAuthRedirect("business");
            window.location.hash = "login";
          }}
        />
        <BottomNav
          mode="profile"
          onFavorites={showFavorites}
          onHome={goBack}
          onProfile={openProfile}
          onPromotions={showPromotions}
          onSearch={openSearch}
        />
      </>
    );
  }

  if (selectedBarId && !selectedBar && isLoadingBars) {
    return (
      <>
        <main className="details-page">
          <section className="empty-state">
            <h2>{t.loadingBarTitle}</h2>
            <p>{t.loadingBarCopy}</p>
          </section>
        </main>
        <BottomNav
          mode="menu"
          onHome={goBack}
          onProfile={openProfile}
          onPromotions={showPromotions}
          onSearch={openSearch}
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
          onSearch={openSearch}
          onFavorites={showFavorites}
          onMenu={scrollToMenu}
          onProfile={openProfile}
          onPromotions={showPromotions}
        />
      </>
    );
  }

  if (route.name === "promotions") {
    return (
      <>
        <PromotionsPage
          bars={barsWithDistance.filter(isWithinDiscoveryRange)}
          isLoading={isLoadingBars}
          onSelectBar={selectBar}
        />
        <BottomNav
          mode="promotions"
          onFavorites={showFavorites}
          onHome={goBack}
          onProfile={openProfile}
          onPromotions={showPromotions}
          onSearch={openSearch}
        />
      </>
    );
  }

  return (
    <>
      <main className="home-page">
        <AppHeader
          hasLocation={hasLocation}
          hasPromotions={bars.some((bar) => bar.promotion)}
          onPromotions={showPromotions}
          isLoading={isLoadingBars}
          isUsingProfileLocation={isUsingProfileLocation}
          locationStatus={locationStatus}
          resultCount={visibleBars.length}
          searchTerm={searchTerm}
          searchSuggestions={searchSuggestions}
          summaryLabel={
            barsLoadError
              ? t.summaryError
              : hasLocation
              ? t.summaryNear(visibleBars.length)
              : isUsingProfileLocation
                ? t.summaryNearAddress(visibleBars.length)
              : t.summaryFound(visibleBars.length)
          }
          title={activeVibe ? activeVibe.label : showFavoritesOnly ? t.favoritesTitle : undefined}
          onRequestLocation={requestLocation}
          onSearchChange={setSearchTerm}
          onSearchSelect={selectSearchSuggestion}
        />
        {showStories && <BarStories bars={visibleBars} onSelectBar={selectBar} />}
        <FilterBar activeFilters={activeFilters} onToggleFilter={toggleFilter} />
        {activeVibe && (
          <div className="vibe-filter-bar">
            <span>
              {t.vibeShowing} <strong>{activeVibe.label}</strong>
            </span>
            <button type="button" onClick={goBack}>
              {t.seeAll}
            </button>
          </div>
        )}
        {isLoadingBars ? (
          <section className="empty-state" aria-live="polite">
            <h2>{t.loadingTitle}</h2>
            <p>{t.loadingCopy}</p>
          </section>
        ) : barsLoadError ? (
          <section className="empty-state" role="alert">
            <h2>{t.errorTitle}</h2>
            <p>{t.errorCopy}</p>
            <button className="primary-action" type="button" onClick={retryLoadBars}>
              {t.retry}
            </button>
          </section>
        ) : bars.length === 0 ? (
          <section className="empty-state">
            <h2>{t.emptyTitle}</h2>
            <p>{t.emptyCopy}</p>
          </section>
        ) : activeVibe && visibleBars.length === 0 ? (
          <section className="empty-state">
            <h2>{t.vibeEmptyTitle(activeVibe.label.toLowerCase())}</h2>
            <p>{t.vibeEmptyCopy}</p>
            <button className="primary-action" type="button" onClick={goBack}>
              {t.seeAll}
            </button>
          </section>
        ) : (
          <>
            {showNearby && (
              <NearbyStrip bars={visibleBars} hasLocation={hasDistanceLocation} onSelectBar={selectBar} />
            )}
            {showNearby && <h2 className="home-section-title">{nearbyText.allTitle}</h2>}
            <BarList
              bars={visibleBars}
              favoriteIds={favoriteIds}
              isFavoritesView={showFavoritesOnly}
              isOpenFilterOn={activeFilters.includes("open")}
              onSelectBar={selectBar}
              onToggleFavorite={toggleFavorite}
            />
          </>
        )}
      </main>
      <BottomNav
        mode={
          showFavoritesOnly
            ? "favorites"
            : activeFilters.includes("promo")
              ? "promotions"
              : "home"
        }
        onFavorites={showFavorites}
        onHome={goBack}
        onProfile={openProfile}
        onPromotions={showPromotions}
        onSearch={openSearch}
      />
    </>
  );
}
