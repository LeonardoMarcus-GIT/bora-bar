import { useEffect, useMemo, useState } from "react";
import AppHeader from "./components/AppHeader.jsx";
import AuthPage from "./components/AuthPage.jsx";
import BarDetails from "./components/BarDetails.jsx";
import BarList from "./components/BarList.jsx";
import BottomNav from "./components/BottomNav.jsx";
import BusinessDashboard from "./components/BusinessDashboard.jsx";
import FilterBar from "./components/FilterBar.jsx";
import ForBusinessPage from "./components/ForBusinessPage.jsx";
import PasswordResetPage from "./components/PasswordResetPage.jsx";
import ProfilePage from "./components/ProfilePage.jsx";
import { ChevronRight, Store } from "lucide-react";
import { useAuth } from "./context/AuthContext.jsx";
import { useGeolocation } from "./hooks/useGeolocation.js";
import { recordBarEvent } from "./services/analyticsService.js";
import { fetchProfile } from "./services/profilesService.js";
import { fetchBars } from "./services/barsService.js";
import { calculateDistanceKm } from "./utils/geo.js";
import { getStartingPrice, normalizeText } from "./utils/format.js";

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

  return { name: "home" };
}

function isPromotionsHash() {
  return window.location.hash.replace("#", "").startsWith("promotions");
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
    // Nao ha estado obrigatorio para limpar.
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
  const [bars, setBars] = useState([]);
  const [isLoadingBars, setIsLoadingBars] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(readFavoriteIds);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [profileLocation, setProfileLocation] = useState(null);
  const {
    coordinates: userLocation,
    hasLocation,
    requestLocation,
    status: locationStatus
  } = useGeolocation();

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
    const onHashChange = () => {
      setRoute(getRoute());

      if (isPromotionsHash()) {
        setShowFavoritesOnly(false);
        setActiveFilters((currentFilters) =>
          currentFilters.includes("promo")
            ? currentFilters
            : [...currentFilters, "promo"]
        );
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    if (isPromotionsHash()) {
      setShowFavoritesOnly(false);
      setActiveFilters((currentFilters) =>
        currentFilters.includes("promo")
          ? currentFilters
          : [...currentFilters, "promo"]
      );
    }

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
  const activeLocation = hasLocation ? userLocation : profileLocation;
  const hasDistanceLocation = Boolean(activeLocation);
  const isUsingProfileLocation = !hasLocation && Boolean(profileLocation);

  const barsWithDistance = useMemo(
    () =>
      bars.map((bar) => {
        const calculatedDistanceKm = hasDistanceLocation
          ? calculateDistanceKm(activeLocation, bar)
          : null;

        return {
          ...bar,
          distanceKm: calculatedDistanceKm ?? bar.distanceKm,
          hasCoordinates:
            Number.isFinite(bar.latitude) && Number.isFinite(bar.longitude),
          hasRealDistance: Number.isFinite(calculatedDistanceKm)
        };
      }),
    [activeLocation, bars, hasDistanceLocation]
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
        const typeLabel =
          suggestion.type === "bar"
            ? "Estabelecimento"
            : suggestion.type === "city"
              ? "Cidade"
              : "Bairro";
        const countLabel = `${suggestion.count} ${suggestion.count === 1 ? "bar" : "bares"}`;

        return {
          ...suggestion,
          typeLabel,
          detail:
            suggestion.type === "bar"
              ? `${suggestion.city} - ${suggestion.bar.neighborhood}`
              : suggestion.type === "city"
              ? `${typeLabel} • ${countLabel}`
              : `${typeLabel} em ${suggestion.city} • ${countLabel}`
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
      const matchesFavorite =
        !showFavoritesOnly || favoriteIds.includes(bar.id);
      return (
        matchesSearch &&
        matchesOpen &&
        matchesPromo &&
        matchesFavorite &&
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
    showFavoritesOnly
  ]);

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
    window.location.hash = "";
    setShowFavoritesOnly(false);
    setActiveFilters([]);
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

  function showPromotions() {
    window.location.hash = "promotions";
    setShowFavoritesOnly(false);
    setActiveFilters((currentFilters) =>
      currentFilters.includes("promo")
        ? currentFilters
        : [...currentFilters, "promo"]
    );
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
    window.location.hash = `bar/${barId}`;
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    const nextBars = await fetchBars();
    setBars(nextBars);
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
          onSearch={goBack}
        />
      </>
    );
  }

  if (route.name === "login") {
    return (
      <>
        <AuthPage onAuthenticated={handleAuthenticated} />
        <BottomNav
          mode="profile"
          onFavorites={showFavorites}
          onHome={goBack}
          onProfile={openProfile}
          onPromotions={showPromotions}
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
          onSearch={goBack}
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
          onSearch={goBack}
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
          onPromotions={showPromotions}
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
          onPromotions={showPromotions}
        />
      </>
    );
  }

  return (
    <>
      <main className="home-page">
        <AppHeader
          hasLocation={hasLocation}
          isLoading={isLoadingBars}
          isUsingProfileLocation={isUsingProfileLocation}
          locationStatus={locationStatus}
          resultCount={visibleBars.length}
          searchTerm={searchTerm}
          searchSuggestions={searchSuggestions}
          summaryLabel={
            hasLocation
              ? `${visibleBars.length} bares perto de voce`
              : isUsingProfileLocation
                ? `${visibleBars.length} bares perto do seu endereco`
              : `${visibleBars.length} bares encontrados`
          }
          onRequestLocation={requestLocation}
          onSearchChange={setSearchTerm}
          onSearchSelect={selectSearchSuggestion}
        />
        <FilterBar activeFilters={activeFilters} onToggleFilter={toggleFilter} />
        <BarList
          bars={visibleBars}
          favoriteIds={favoriteIds}
          isFavoritesView={showFavoritesOnly}
          onSelectBar={selectBar}
          onToggleFavorite={toggleFavorite}
        />
        <section className="home-business-invite">
          <span className="home-business-icon">
            <Store size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>Seu estabelecimento no Bora Bar</strong>
            <p>Atualize cardápio, promoções e eventos pelo celular.</p>
          </div>
          <button type="button" onClick={openForBusiness} aria-label="Conhecer o Bora Bar para estabelecimentos">
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </section>
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
        onSearch={focusSearch}
      />
    </>
  );
}
