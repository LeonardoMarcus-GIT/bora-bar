import { useEffect, useRef, useState } from "react";

function prefersReducedMotion() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

// Mostra o texto palavra por palavra (cada uma sobe um pouco depois da anterior).
// `start` é o número da primeira palavra, para encadear duas linhas em sequência.
export function RevealWords({ text, start = 0 }) {
  return text.split(" ").map((word, index) => (
    <span key={`${word}-${index}`}>
      <span className="reveal-word" style={{ "--i": start + index }}>
        {word}
      </span>{" "}
    </span>
  ));
}

// Troca de frase de tempos em tempos, com a nova entrando por baixo.
// Quem pede menos movimento vê só a primeira frase.
export function RotatingText({ items, interval = 3400, as: Tag = "strong" }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length < 2 || prefersReducedMotion()) {
      return undefined;
    }

    const timerId = window.setInterval(
      () => setIndex((current) => (current + 1) % items.length),
      interval
    );
    return () => window.clearInterval(timerId);
  }, [items.length, interval]);

  return (
    <Tag className="rotating-text" key={index} aria-live="off">
      {items[index]}
    </Tag>
  );
}

// Número que "conta" até o valor final (ex.: 0, 1, 2…). Sem animação para quem pede menos movimento.
export function CountUp({ value, duration = 800 }) {
  const [shown, setShown] = useState(0);
  const shownRef = useRef(0);

  useEffect(() => {
    const target = Number(value) || 0;

    if (prefersReducedMotion() || target === shownRef.current) {
      shownRef.current = target;
      setShown(target);
      return undefined;
    }

    const from = shownRef.current;
    const startedAt = performance.now();
    let frameId = 0;

    function tick(now) {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (target - from) * eased);

      shownRef.current = current;
      setShown(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    }

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  return <>{shown}</>;
}
