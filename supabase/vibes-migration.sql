-- Bora Bar - "Clima do lugar" (bars.vibes)
-- Já aplicado no projeto em 15/10/2026. Só adiciona; não apaga nada.
-- Valores usados: barzinho, comer-bem, drinks, musica-ao-vivo, festa, date,
-- assistir-jogo, rooftop (lista em src/utils/vibes.js).

alter table public.bars
add column if not exists vibes text[] not null default '{}';

grant update (vibes) on public.bars to authenticated;
