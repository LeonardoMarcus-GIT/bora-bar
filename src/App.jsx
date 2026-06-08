import { useEffect, useMemo, useState } from "react";
import AppHeader from "./components/AppHeader.jsx";
import BarDetails from "./components/BarDetails.jsx";
import BarList from "./components/BarList.jsx";
import FilterBar from "./components/FilterBar.jsx";
import { mockBars } from "./data/mockBars.js";
import { getStartingPrice, normalizeText } from "./utils/format.js";

function getInitialBar() {
  const hashId = window.location.hash.replace("#bar/", "");
  return mockBars.find((bar) => bar.id === hashId) ?? null;
}

export default function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState([]);
  const [selectedBar, setSelectedBar] = useState(getInitialBar);

  useEffect(() => {
    const onHashChange = () => setSelectedBar(getInitialBar());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

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

      return matchesSearch && matchesOpen && matchesPromo;
    });

    if (activeFilters.includes("cheap")) {
      bars = [...bars].sort((a, b) => getStartingPrice(a) - getStartingPrice(b));
    }

    if (activeFilters.includes("near")) {
      bars = [...bars].sort((a, b) => a.distanceKm - b.distanceKm);
    }

    return bars;
  }, [activeFilters, searchTerm]);

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
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (selectedBar) {
    return <BarDetails bar={selectedBar} onBack={goBack} />;
  }

  return (
    <main className="home-page">
      <AppHeader
        resultCount={visibleBars.length}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      <FilterBar activeFilters={activeFilters} onToggleFilter={toggleFilter} />
      <BarList bars={visibleBars} onSelectBar={selectBar} />
    </main>
  );
}
