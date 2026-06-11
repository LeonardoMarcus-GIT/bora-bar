import { Bell, MapPin, Search } from "lucide-react";
import logoSrc from "../assets/bora-bar-icon.png";

export default function AppHeader({
  isLoading,
  searchTerm,
  onSearchChange,
  resultCount,
  summaryLabel
}) {
  return (
    <header className="app-header">
      <div className="app-topbar">
        <div className="brand-lockup">
          <span className="brand-logo-slot" aria-label="Logo Bora Bar">
            <img src={logoSrc} alt="Bora Bar" />
          </span>
          <div className="brand-copy">
            <h1>Bora Bar</h1>
            <p className="brand-kicker">Escolha o bar antes de sair</p>
          </div>
        </div>
        <button
          className="icon-action"
          type="button"
          aria-label="Notificacoes"
          title="Notificacoes"
        >
          <Bell size={19} aria-hidden="true" />
        </button>
      </div>

      <label className="search-box">
        <Search size={20} aria-hidden="true" />
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Cidade ou bairro"
          aria-label="Buscar por cidade ou bairro"
        />
      </label>

      <div className="location-summary" aria-live="polite">
        <MapPin size={18} aria-hidden="true" />
        <span>
          {isLoading ? "Carregando bares" : summaryLabel ?? `${resultCount} bares encontrados`}
        </span>
      </div>
    </header>
  );
}
