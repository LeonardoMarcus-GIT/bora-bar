-- Bora Bar - estabelecimento visível ou não no guia
-- Rode uma vez no SQL Editor do Supabase (já aplicado no projeto em 15/10/2026).
--
-- is_listed = true  -> aparece no guia Bora Bar (lista, busca, filtros)
-- is_listed = false -> só a página avulsa /r/<id> (QR Code / link no Instagram)
--
-- Só o administrador altera (a coluna NÃO está na lista de colunas que o dono
-- pode atualizar). Para colocar um estabelecimento no guia:
--   update public.bars set is_listed = true where id = '<id>';

alter table public.bars
add column if not exists is_listed boolean not null default true;

comment on column public.bars.is_listed is
  'true = aparece no guia Bora Bar; false = só a página avulsa /r/<id> (link/QR do próprio estabelecimento). Só o admin altera.';

create index if not exists bars_is_listed_idx on public.bars (is_listed);
