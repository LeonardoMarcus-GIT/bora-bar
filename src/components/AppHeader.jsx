import { Bell, MapPin, Search } from "lucide-react";

export default function AppHeader({ searchTerm, onSearchChange, resultCount }) {
  return (
    <header className="app-header">
      <div className="app-topbar">
        <div className="brand-lockup">
          <span className="brand-mark">BB</span>
          <div>
            <p className="brand-kicker">Bora Bar</p>
            <h1>Escolha o bar antes de sair</h1>
          </div>
        </div>
        <button className="icon-action" type="button" aria-label="Notificações" title="Notificações">
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
        <span>{resultCount} bares encontrados</span>
      </div>
    </header>
  );
}
