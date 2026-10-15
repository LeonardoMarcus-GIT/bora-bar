// "Clima do lugar": o que o estabelecimento oferece (barzinho, música ao vivo,
// jogo, date...). O dono marca no painel (bars.vibes). Música ao vivo e jogo
// também são reconhecidos sozinhos pelos próximos eventos cadastrados.

export const VIBES = [
  { id: "barzinho", label: "Barzinho" },
  { id: "comer-bem", label: "Comer bem" },
  { id: "drinks", label: "Drinks" },
  { id: "musica-ao-vivo", label: "Música ao vivo" },
  { id: "festa", label: "Festa" },
  { id: "date", label: "Date" },
  { id: "assistir-jogo", label: "Assistir jogo" },
  { id: "rooftop", label: "Rooftop" }
];

const EVENT_HINTS = {
  "musica-ao-vivo": /m[uú]sica|ao vivo|samba|pagode|sertanejo|forr[oó]|rock|mpb|banda|show|dj|roda/i,
  "assistir-jogo": /jogo|futebol|tel[aã]o|campeonato|brasileir[aã]o|libertadores|copa|cl[aá]ssico|final/i
};

export function getVibe(vibeId) {
  return VIBES.find((vibe) => vibe.id === vibeId) ?? null;
}

export function barMatchesVibe(bar, vibeId) {
  if (!vibeId) {
    return true;
  }

  if ((bar.vibes ?? []).includes(vibeId)) {
    return true;
  }

  const hint = EVENT_HINTS[vibeId];

  return Boolean(
    hint &&
      (bar.events ?? []).some((event) => hint.test(`${event.title} ${event.description ?? ""}`))
  );
}
