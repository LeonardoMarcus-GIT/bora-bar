import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, MessageCircle, Navigation, X } from "lucide-react";
import { recordBarEvent } from "../services/analyticsService.js";
import { getRouteLinks, getWhatsappLink } from "../utils/barLinks.js";
import { formatEventWhen } from "../utils/format.js";
import { stories as t } from "../texts/app.js";
import { barDetails as barText } from "../texts/bar.js";

const SLIDE_MS = 5000;
const SEEN_KEY = "bora-bar-stories-vistos";
const SEEN_LIMIT = 300;
const VIEWED_SESSION_PREFIX = "bora-bar-story-visto-";

// Stories já vistos ficam só neste celular (nunca vão para o servidor).
function readSeen() {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function saveSeen(seen) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen].slice(-SEEN_LIMIT)));
  } catch {
    // Armazenamento bloqueado: só não lembra o que foi visto.
  }
}

// Conta uma visualização do story por bar e por sessão (métrica anônima).
function recordStoryViewOnce(barId) {
  try {
    if (sessionStorage.getItem(VIEWED_SESSION_PREFIX + barId)) return;
    sessionStorage.setItem(VIEWED_SESSION_PREFIX + barId, "1");
  } catch {
    // Sem armazenamento a visualização ainda é registrada.
  }
  void recordBarEvent(barId, "story_view");
}

// Evento entra no story se já começou ou começa até o fim de amanhã.
function isSoon(startsAt, now = new Date()) {
  const date = new Date(startsAt);
  const limit = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
  return !Number.isNaN(date.getTime()) && date < limit;
}

// Um story por bar com promoção valendo hoje ou evento de hoje/amanhã:
// é o que o dono publica no painel. A foto da promoção/evento vira o fundo.
function buildStories(bars) {
  return bars
    .map((bar) => {
      const promotions = bar.promotions?.length
        ? bar.promotions
        : bar.promotion
          ? [{ id: "promo", title: bar.promotion, description: "" }]
          : [];
      const slides = [
        ...promotions.slice(0, 2).map((promotion) => ({
          key: `${bar.id}:p:${promotion.id}`,
          image: promotion.imageUrl || bar.image,
          kicker: t.promotion,
          title: promotion.title,
          line: promotion.description || [bar.neighborhood, bar.openStatusDetail].filter(Boolean).join(" · ")
        })),
        ...(bar.events ?? [])
          .filter((event) => isSoon(event.startsAt))
          .slice(0, 2)
          .map((event) => {
            const when = formatEventWhen(event.startsAt);
            return {
              key: `${bar.id}:e:${event.id}`,
              image: event.imageUrl || bar.image,
              kicker: when.startsWith("Hoje") ? t.eventToday : t.event,
              title: event.title,
              line: [when, event.description].filter(Boolean).join(" · ")
            };
          })
      ];
      return { bar, slides };
    })
    .filter((story) => story.slides.length);
}

// isPreview: bares de exemplo (landing) — não registra métrica nem mostra contato.
export default function BarStories({ bars, isPreview = false, onSelectBar }) {
  const [seen, setSeen] = useState(readSeen);
  const [open, setOpen] = useState(null); // { story, slide, list }

  // Quem tem novidade aparece primeiro; dentro de cada grupo, a ordem da lista (mais perto antes).
  const stories = buildStories(bars)
    .map((story) => ({ ...story, isSeen: story.slides.every((slide) => seen.has(slide.key)) }))
    .sort((a, b) => Number(a.isSeen) - Number(b.isSeen));

  const markSeen = useCallback((key) => {
    setSeen((current) => {
      if (current.has(key)) return current;
      const next = new Set(current).add(key);
      saveSeen(next);
      return next;
    });
  }, []);

  if (!stories.length) return null;

  function openStory(index) {
    // A ordem fica congelada enquanto o story está aberto.
    const story = stories[index];
    const firstUnseen = story.slides.findIndex((slide) => !seen.has(slide.key));
    setOpen({ list: stories, story: index, slide: Math.max(0, firstUnseen) });
  }

  return (
    <>
      <div className="bar-stories" role="list" aria-label={t.ariaLabel}>
        {stories.map((story, index) => (
          <button
            className={`bar-story${story.isSeen ? " is-seen" : ""}`}
            type="button"
            role="listitem"
            key={story.bar.id}
            style={{ "--i": index }}
            onClick={() => openStory(index)}
            aria-label={`${story.bar.name}${story.isSeen ? ` (${t.seen})` : ""}`}
          >
            <span className="bar-story-ring">
              <img src={story.slides[0].image} alt="" loading="lazy" />
            </span>
            <span className="bar-story-name">{story.bar.name.split(" ")[0]}</span>
          </button>
        ))}
      </div>
      {open &&
        createPortal(
          <StoryViewer
            stories={open.list}
            isPreview={isPreview}
            position={open}
            onChange={(position) => setOpen((current) => ({ ...current, ...position }))}
            onClose={() => setOpen(null)}
            onSeen={markSeen}
            onSelectBar={(bar) => {
              if (!isPreview) void recordBarEvent(bar.id, "story_open");
              setOpen(null);
              onSelectBar(bar);
            }}
          />,
          document.body
        )}
    </>
  );
}

function StoryViewer({ stories, isPreview, position, onChange, onClose, onSeen, onSelectBar }) {
  const { bar, slides } = stories[position.story];
  const slide = slides[position.slide];
  const barRef = useRef(null);
  const pausedRef = useRef(false);
  const closeRef = useRef(null);
  const whatsappLink = isPreview ? "" : getWhatsappLink(bar.phone);
  const routeLink = !isPreview && (bar.address || bar.hasCoordinates) ? getRouteLinks(bar).google : "";

  useEffect(() => {
    onSeen(slide.key);
    if (!isPreview) recordStoryViewOnce(bar.id);
  }, [bar.id, isPreview, onSeen, slide.key]);

  const go = useCallback(
    (step) => {
      let story = position.story;
      let index = position.slide + step;
      if (index >= stories[story].slides.length) {
        story += 1;
        index = 0;
      }
      if (index < 0) {
        story = Math.max(0, story - 1);
        index = story === position.story ? 0 : stories[story].slides.length - 1;
      }
      if (story >= stories.length) return onClose();
      onChange({ story, slide: index });
    },
    [onChange, onClose, position, stories]
  );

  // Barra de progresso e avanço automático (pausa enquanto o dedo está na tela).
  useEffect(() => {
    let frame;
    let elapsed = 0;
    let last = performance.now();
    const tick = (now) => {
      if (!pausedRef.current) elapsed += now - last;
      last = now;
      const progress = Math.min(1, elapsed / SLIDE_MS);
      if (barRef.current) barRef.current.style.width = `${progress * 100}%`;
      if (progress >= 1) return go(1);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [go]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") go(1);
      if (event.key === "ArrowLeft") go(-1);
    };
    const release = () => (pausedRef.current = false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerup", release);
    document.body.classList.add("is-locked");
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerup", release);
      document.body.classList.remove("is-locked");
    };
  }, [go, onClose]);

  return (
    <div className="story-viewer" role="dialog" aria-modal="true" aria-label={t.dialogAria(bar.name)}>
      <div className="story-frame">
        <img className="story-photo" src={slide.image} alt="" key={slide.key} />
        <div className="story-progress">
          {slides.map((item, index) => (
            <i key={item.key}>
              <b
                ref={index === position.slide ? barRef : undefined}
                style={{ width: index < position.slide ? "100%" : "0%" }}
              />
            </i>
          ))}
        </div>
        <header className="story-top">
          <img src={bar.image} alt="" />
          <span>
            <strong>{bar.name}</strong>
            <small>{[bar.neighborhood, bar.openStatusDetail].filter(Boolean).join(" · ")}</small>
          </span>
          <button ref={closeRef} type="button" onClick={onClose} aria-label={t.close}>
            <X size={24} aria-hidden="true" />
          </button>
        </header>
        <button
          className="story-zone story-zone-prev"
          type="button"
          aria-label={t.previous}
          onPointerDown={() => (pausedRef.current = true)}
          onClick={() => go(-1)}
        />
        <button
          className="story-zone story-zone-next"
          type="button"
          aria-label={t.next}
          onPointerDown={() => (pausedRef.current = true)}
          onClick={() => go(1)}
        />
        <div className="story-text" key={slide.key}>
          <p className="story-kicker">{slide.kicker}</p>
          <h2>{slide.title}</h2>
          {slide.line && <p>{slide.line}</p>}
          <div className="story-actions">
            <button className="primary-action" type="button" onClick={() => onSelectBar(bar)}>
              {t.seeBar} <ArrowUpRight size={18} aria-hidden="true" />
            </button>
            {routeLink && (
              <a
                className="story-action"
                href={routeLink}
                target="_blank"
                rel="noreferrer"
                onClick={() => void recordBarEvent(bar.id, "route_google")}
                aria-label={t.route}
              >
                <Navigation size={18} aria-hidden="true" />
                <span>{t.route}</span>
              </a>
            )}
            {whatsappLink && (
              <a
                className="story-action"
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                onClick={() => void recordBarEvent(bar.id, "whatsapp")}
              >
                <MessageCircle size={18} aria-hidden="true" />
                <span>{bar.takesWhatsappOrders ? barText.whatsappOrders : barText.whatsappQuestions}</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
