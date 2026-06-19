-- Bora Bar - endereco estruturado para estabelecimentos
-- Rode este arquivo uma vez no SQL Editor do Supabase.

alter table public.bars
add column if not exists postal_code text;

alter table public.bars
add column if not exists street text;

alter table public.bars
add column if not exists address_number text;

alter table public.bars
add column if not exists address_complement text;

alter table public.bars
add column if not exists state text;

alter table public.bars
add column if not exists state_code text;

revoke update on public.bars from authenticated;

grant update (
  name,
  neighborhood,
  city,
  image_url,
  latitude,
  longitude,
  is_open,
  price_level,
  address,
  postal_code,
  street,
  address_number,
  address_complement,
  state,
  state_code,
  hours,
  phone,
  description,
  updated_at
) on public.bars to authenticated;

create index if not exists bars_postal_code_idx
on public.bars (postal_code);
