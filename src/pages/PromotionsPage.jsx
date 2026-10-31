import { ArrowUpRight, BadgePercent, Music } from "lucide-react";
import StatusBadge from "../components/StatusBadge.jsx";
import { promotionsPage as t } from "../texts/app.js";

const AGENDA_LIMIT = 30;

// Promoções valendo agora: todas as do bar (ou a de texto livre, nos bares antigos).
function buildPromotions(bars) {
  return bars.flatMap((bar) => {
    const promotions = bar.promotions?.length
      ? bar.promotions
      : bar.promotion
        ? [{ id: "promo", title: bar.promotion, imageUrl: "" }]
        : [];
    return promotions.map((promotion) => ({ bar, promotion }));
  });
}

// Agenda: eventos de todos os bares, do mais próximo para o mais distante.
function buildAgenda(bars, now) {
  return bars
    .flatMap((bar) =>
      (bar.events ?? [])
        .filter((event) => !Number.isNaN(new Date(event.startsAt).getTime()))
        .map((event) => ({ bar, event, date: new Date(event.startsAt) }))
    )
    .filter(({ event, date }) => new Date(event.endsAt ?? date) >= now)
    .sort((a, b) => a.date - b.date)
    .slice(0, AGENDA_LIMIT);
}

function formatHour(date) {
  const minutes = date.getMinutes();
  return minutes ? `${date.getHours()}h${String(minutes).padStart(2, "0")}` : `${date.getHours()}h`;
}

// "Hoje às 20h30", "Amanhã às 21h", "Segunda às 19h" ou "15/11 às 20h".
function formatAgendaWhen(date, now) {
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(date) - startOfDay(now)) / 86400000);
  const day =
    days <= 0
      ? t.today
      : days === 1
        ? t.tomorrow
        : days < 7
          ? t.weekdays[date.getDay()]
          : date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  return t.at(day, formatHour(date));
}

// Tela "Promoções" (#promotions), como na Versão 3 "Bolso": cartões das
// promoções de hoje e, embaixo, a agenda com evento, local e horário.
export default function PromotionsPage({ bars, isLoading, onSelectBar }) {
  const now = new Date();
  const promotions = buildPromotions(bars);
  const agenda = buildAgenda(bars, now);

  return (
    <main className="home-page promotions-page">
      <header className="promo-top">
        <p className="promo-kicker">{t.kicker}</p>
        <h1>{t.title}</h1>
      </header>

      {isLoading ? (
        <section className="empty-state" aria-live="polite">
          <h2>{t.loading}</h2>
        </section>
      ) : (
        <>
          <h2 className="home-section-title">
            <BadgePercent size={18} aria-hidden="true" />
            {t.promotionsTitle}
          </h2>
          {promotions.length ? (
            <div className="promo-list">
              {promotions.map(({ bar, promotion }) => (
                <button
                  className="promo-card"
                  type="button"
                  key={`${bar.id}-${promotion.id}`}
                  onClick={() => onSelectBar(bar)}
                >
                  <img src={promotion.imageUrl || bar.image} alt="" loading="lazy" />
                  <span className="promo-card-body">
                    <span className="promo-kicker">
                      {[bar.name, bar.neighborhood].filter(Boolean).join(" · ")}
                    </span>
                    <strong>{promotion.title}</strong>
                    <StatusBadge
                      isOpen={bar.isOpen}
                      isClosingSoon={bar.isClosingSoon}
                      detail={bar.openStatusDetail}
                    />
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="promo-empty">{t.noPromotions}</p>
          )}

          <h2 className="home-section-title">
            <Music size={18} aria-hidden="true" />
            {t.agendaTitle}
          </h2>
          {agenda.length ? (
            <ul className="agenda-list">
              {agenda.map(({ bar, event, date }) => (
                <li key={`${bar.id}-${event.id}`}>
                  <button type="button" onClick={() => onSelectBar(bar)}>
                    <time dateTime={date.toISOString()}>
                      <b>{date.getDate()}</b>
                      {t.shortWeekdays[date.getDay()]}
                    </time>
                    <span className="agenda-text">
                      <strong>{event.title}</strong>
                      <span>
                        {bar.name} · {formatAgendaWhen(date, now)}
                      </span>
                    </span>
                    <ArrowUpRight size={18} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="promo-empty">{t.noEvents}</p>
          )}
        </>
      )}
    </main>
  );
}
