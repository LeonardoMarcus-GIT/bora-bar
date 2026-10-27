// Transição entre a lista e a página do bar: a foto do card "cresce" até virar a capa da página
// (e volta ao voltar). Usa a View Transitions API do navegador; onde ela não existe (ou quem pede
// menos movimento), a troca de tela acontece direto, como antes.
import { flushSync } from "react-dom";

const SHARED_NAME = "bar-hero";

function canAnimate() {
  try {
    return (
      typeof document.startViewTransition === "function" &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  } catch {
    return false;
  }
}

function tagCardImage(barId) {
  const image = document.querySelector(
    `[data-flip-id="${CSS.escape(barId)}"] .bar-card-image`
  );

  if (image) {
    image.style.viewTransitionName = SHARED_NAME;
  }

  return image;
}

// `update` troca a rota (setRoute). `previous` e `next` são as rotas de src/App.jsx.
export function transitionRoute(update, previous, next) {
  const goingToBar = previous.name === "home" && next.name === "bar";
  const comingBack = previous.name === "bar" && next.name === "home";

  if (!canAnimate() || (!goingToBar && !comingBack)) {
    update();
    return;
  }

  const root = document.documentElement;
  let taggedImage = goingToBar ? tagCardImage(next.barId) : null;

  root.classList.add("vt-running");

  const transition = document.startViewTransition(() => {
    if (taggedImage) {
      taggedImage.style.viewTransitionName = "";
    }

    flushSync(update);

    if (comingBack) {
      taggedImage = tagCardImage(previous.barId);
    }
  });

  transition.finished.finally(() => {
    if (taggedImage) {
      taggedImage.style.viewTransitionName = "";
    }

    root.classList.remove("vt-running");
  });
}
