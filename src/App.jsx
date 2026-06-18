import { useEffect, useMemo, useState } from "react";
import AppHeader from "./components/AppHeader.jsx";
import AuthPage from "./components/AuthPage.jsx";
import BarDetails from "./components/BarDetails.jsx";
import BarList from "./components/BarList.jsx";
import BottomNav from "./components/BottomNav.jsx";
import BusinessDashboard from "./components/BusinessDashboard.jsx";
import FilterBar from "./components/FilterBar.jsx";
import GeoControls from "./components/GeoControls.jsx";
import PasswordResetPage from "./components/PasswordResetPage.jsx";
import ProfilePage from "./components/ProfilePage.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { useGeolocation } from "./hooks/useGeolocation.js";
import { fetchProfile } from "./services/profilesService.js";
import { fetchBars } from "./services/barsService.js";
import { calculateDistanceKm } from "./utils/geo.js";
import { getStartingPrice, normalizeText } from "./utils/format.js";

const FAVORITES_KEY = "bora-bar-favorites";

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
  const latitude = Number(profile.latitude ?? metadata.latitude);
  const longitude = Number(profile.longitude ?? metadata.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    latitude,
    longitude,
    source:
      profile.locationSource ??
      profile.location_source ??
      metadata.location_source ??
      metadata.locationSource
  };
}

export default function App() {
  const { user } = useAuth();
  const [route, setRoute] = useState(getRoute);
  const [bars, setBars] = useState([]);
  const [isLoadingBars, setIsLoadingBars] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(readFavoriteIds);
  const [radiusKm, setRadiusKm] = useState(5);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [profileLocation, setProfileLocation] = useState(null);
  const {
    coordinates: userLocation,
    errorMessage: locationError,
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
      const matchesRadius =
        !hasDistanceLocation ||
        !activeFilters.includes("near") ||
        (bar.hasRealDistance && bar.distanceKm <= radiusKm);

      return (
        matchesSearch &&
        matchesOpen &&
        matchesPromo &&
        matchesFavorite &&
        matchesRadius
      );
    });

    if (activeFilters.includes("cheap")) {
      nextBars = [...nextBars].sort(
        (a, b) => getStartingPrice(a) - getStartingPrice(b)
      );
    }

    if (activeFilters.includes("near") && hasDistanceLocation) {
      nextBars = [...nextBars].sort((a, b) => a.distanceKm - b.distanceKm);
    }

    return nextBars;
  }, [
    activeFilters,
    barsWithDistance,
    favoriteIds,
    hasDistanceLocation,
    radiusKm,
    searchTerm,
    showFavoritesOnly
  ]);

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

  if (route.name === "business") {
    return (
      <>
        <BusinessDashboard
          bars={bars}
          onBack={goBack}
          onDataChanged={refreshBars}
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
          isLoading={isLoadingBars}
          resultCount={visibleBars.length}
          searchTerm={searchTerm}
          summaryLabel={
            hasLocation
              ? `${visibleBars.length} bares perto de voce`
              : isUsingProfileLocation
                ? `${visibleBars.length} bares perto do seu endereco`
              : `${visibleBars.length} bares encontrados`
          }
          onSearchChange={setSearchTerm}
        />
        <FilterBar activeFilters={activeFilters} onToggleFilter={toggleFilter} />
        <GeoControls
          activeFilters={activeFilters}
          locationError={locationError}
          locationStatus={locationStatus}
          isUsingProfileLocation={isUsingProfileLocation}
          radiusKm={radiusKm}
          onRadiusChange={setRadiusKm}
          onRequestLocation={requestLocation}
        />
        <BarList
          bars={visibleBars}
          favoriteIds={favoriteIds}
          isFavoritesView={showFavoritesOnly}
          onSelectBar={selectBar}
          onToggleFavorite={toggleFavorite}
        />
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
