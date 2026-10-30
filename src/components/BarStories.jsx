import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, X } from "lucide-react";
import { formatEventWhen } from "../utils/format.js";
import { stories as t } from "../texts/app.js";

const SLIDE_MS = 5000;

// Um story por bar que tem promoção ou evento: é o que o dono publica no painel.
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
          key: `p-${promotion.id}`,
          kicker: t.promotion,
          title: promotion.title,
          line: promotion.description || [bar.neighborhood, bar.openStatusDetail].filter(Boolean).join(" · ")
        })),
        ...(bar.events ?? []).slice(0, 2).map((event) => {
          const when = formatEventWhen(event.startsAt);
          return {
            key: `e-${event.id}`,
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

export default function BarStories({ bars, onSelectBar }) {
  const stories = buildStories(bars);
  const [open, setOpen] = useState(null); // { story, slide }

  if (!stories.length) return null;

  return (
    <>
      <div className="bar-stories" role="list" aria-label={t.ariaLabel}>
        {stories.map((story, index) => (
          <button
            className="bar-story"
            type="button"
            role="listitem"
            key={story.bar.id}
            style={{ "--i": index }}
            onClick={() => setOpen({ story: index, slide: 0 })}
          >
            <span className="bar-story-ring">
              <img src={story.bar.image} alt="" loading="lazy" />
            </span>
            <span className="bar-story-name">{story.bar.name.split(" ")[0]}</span>
          </button>
        ))}
      </div>
      {open &&
        createPortal(
          <StoryViewer
            stories={stories}
            position={open}
            onChange={setOpen}
            onClose={() => setOpen(null)}
            onSelectBar={(bar) => {
              setOpen(null);
              onSelectBar(bar);
            }}
          />,
          document.body
        )}
    </>
  );
}

function StoryViewer({ stories, position, onChange, onClose, onSelectBar }) {
  const { bar, slides } = stories[position.story];
  const slide = slides[position.slide];
  const barRef = useRef(null);
  const pausedRef = useRef(false);
  const closeRef = useRef(null);

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
        <img className="story-photo" src={bar.image} alt="" key={`${bar.id}-${slide.key}`} />
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
            <small>{bar.neighborhood}</small>
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
          <button className="primary-action" type="button" onClick={() => onSelectBar(bar)}>
            {t.seeBar} <ArrowUpRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
