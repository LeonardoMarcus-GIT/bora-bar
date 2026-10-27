import { BadgePercent, Clock3, Route, WalletCards } from "lucide-react";

import { filters as t } from "../texts/app.js";

const filters = [
  { id: "open", label: t.open, icon: Clock3 },
  { id: "cheap", label: t.cheap, icon: WalletCards },
  { id: "near", label: t.near, icon: Route },
  { id: "promo", label: t.promo, icon: BadgePercent }
];

export default function FilterBar({ activeFilters, onToggleFilter }) {
  return (
    <section className="filter-strip" aria-label={t.ariaLabel}>
      {filters.map((filter) => {
        const Icon = filter.icon;
        const isActive = activeFilters.includes(filter.id);

        return (
          <button
            className={`filter-chip ${isActive ? "is-active" : ""}`}
            key={filter.id}
            type="button"
            onClick={() => onToggleFilter(filter.id)}
            aria-pressed={isActive}
          >
            <Icon size={17} aria-hidden="true" />
            <span>{filter.label}</span>
          </button>
        );
      })}
    </section>
  );
}
