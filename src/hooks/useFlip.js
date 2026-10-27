import { useLayoutEffect, useRef } from "react";

// Quando a lista muda (filtro, busca, favoritos), os itens que continuam deslizam do lugar antigo
// para o novo em vez de "pular". Cada item precisa de data-flip-id; `key` muda quando a lista muda.
export function useFlip(containerRef, key) {
  const previousPositions = useRef(new Map());

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container) {
      previousPositions.current = new Map();
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const containerBox = container.getBoundingClientRect();
    const nextPositions = new Map();

    container.querySelectorAll("[data-flip-id]").forEach((item) => {
      const box = item.getBoundingClientRect();
      // Posição dentro do container: a rolagem da página não conta como movimento.
      const position = { left: box.left - containerBox.left, top: box.top - containerBox.top };
      const before = previousPositions.current.get(item.dataset.flipId);

      nextPositions.set(item.dataset.flipId, position);

      if (!before || reduceMotion) {
        return;
      }

      const dx = before.left - position.left;
      const dy = before.top - position.top;

      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        item.animate(
          [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }],
          { duration: 340, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
        );
      }
    });

    previousPositions.current = nextPositions;
  }, [containerRef, key]);
}
