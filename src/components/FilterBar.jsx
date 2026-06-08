import { BadgePercent, Clock3, Route, WalletCards } from "lucide-react";

const filters = [
  { id: "open", label: "Aberto agora", icon: Clock3 },
  { id: "cheap", label: "Mais barato", icon: WalletCards },
  { id: "near", label: "Mais próximo", icon: Route },
  { id: "promo", label: "Com promoção", icon: BadgePercent }
];

export default function FilterBar({ activeFilters, onToggleFilter }) {
  return (
    <section className="filter-strip" aria-label="Filtros">
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
