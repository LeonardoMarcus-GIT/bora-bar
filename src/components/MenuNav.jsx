import { useEffect, useRef, useState } from "react";
import { getCategoryAnchor, getCategoryLabel } from "./MenuCategory.jsx";

// Atalhos do cardápio: botões por categoria, grudados no topo enquanto a
// pessoa está no cardápio. Tocar desliza suave até a categoria; a categoria
// visível fica destacada. Uma linha só: no celular, desliza pro lado com o dedo,
// e a fileira anda sozinha para mostrar a categoria atual.
export default function MenuNav({ categories }) {
  const [activeAnchor, setActiveAnchor] = useState(
    categories.length ? getCategoryAnchor(categories[0]) : ""
  );

  // Depois de um toque, a categoria tocada fica marcada enquanto a página
  // desliza até ela (senão o destaque "pula" durante a animação).
  const lockUntilRef = useRef(0);
  const navRef = useRef(null);

  // Mantém o botão ativo visível na fileira (rola só a fileira, não a página).
  useEffect(() => {
    const nav = navRef.current;
    const button = nav?.querySelector(`[data-anchor="${activeAnchor}"]`);

    if (!nav || !button) {
      return;
    }

    const target = button.offsetLeft - (nav.clientWidth - button.offsetWidth) / 2;
    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    nav.scrollTo({ left: Math.max(0, target), behavior: prefersReducedMotion ? "auto" : "smooth" });
  }, [activeAnchor]);

  useEffect(() => {
    const anchors = categories.map((name) => getCategoryAnchor(name));
    let frame = 0;

    // Categoria atual = a última cujo topo já passou da faixa dos atalhos.
    // No fim da página (quando as últimas não conseguem subir até lá), vale a
    // última categoria que está aparecendo na tela.
    function updateActive() {
      frame = 0;

      if (Date.now() < lockUntilRef.current) {
        return;
      }

      const navBottom = (document.querySelector(".menu-nav")?.getBoundingClientRect().bottom ?? 0) + 24;
      const sections = anchors
        .map((anchor) => document.getElementById(anchor))
        .filter(Boolean);

      if (!sections.length) {
        return;
      }

      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      let current = sections[0].id;

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();

        if (rect.top <= navBottom || (atBottom && rect.top < window.innerHeight * 0.85)) {
          current = section.id;
        }
      });

      setActiveAnchor(current);
    }

    function onScroll() {
      if (!frame) {
        frame = window.requestAnimationFrame(updateActive);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    updateActive();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [categories]);

  function goTo(anchor) {
    const target = document.getElementById(anchor);

    if (!target) {
      return;
    }

    setActiveAnchor(anchor);
    lockUntilRef.current = Date.now() + 1100;
    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
  }

  return (
    <nav className="menu-nav" aria-label="Categorias do cardápio" ref={navRef}>
      {categories.map((name) => {
        const anchor = getCategoryAnchor(name);

        return (
          <button
            className={activeAnchor === anchor ? "is-active" : ""}
            type="button"
            key={anchor}
            data-anchor={anchor}
            onClick={() => goTo(anchor)}
            aria-current={activeAnchor === anchor ? "true" : undefined}
          >
            {getCategoryLabel(name)}
          </button>
        );
      })}
    </nav>
  );
}
