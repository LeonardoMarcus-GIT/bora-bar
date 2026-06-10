-- Bora Bar - estrutura inicial do Supabase
-- Rode este arquivo no SQL Editor do Supabase.

create table if not exists public.bars (
  id text primary key,
  name text not null,
  neighborhood text not null,
  city text not null,
  image_url text not null,
  distance_km numeric(5, 2) not null default 0,
  is_open boolean not null default false,
  price_level text not null default '$$',
  promotion text not null default '',
  address text not null,
  hours text not null,
  phone text not null,
  description text not null,
  menu jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  bar_id text not null references public.bars(id) on delete cascade,
  author text not null,
  comment text not null,
  rating integer not null check (rating between 1 and 5),
  created_at timestamptz not null default now()
);

alter table public.bars enable row level security;
alter table public.reviews enable row level security;

drop policy if exists "Anyone can read bars" on public.bars;
create policy "Anyone can read bars"
on public.bars
for select
to anon
using (true);

drop policy if exists "Anyone can read reviews" on public.reviews;
create policy "Anyone can read reviews"
on public.reviews
for select
to anon
using (true);

drop policy if exists "Anyone can create reviews" on public.reviews;
create policy "Anyone can create reviews"
on public.reviews
for insert
to anon
with check (
  length(trim(author)) between 2 and 80
  and length(trim(comment)) between 2 and 600
  and rating between 1 and 5
);

grant select on public.bars to anon;
grant select, insert on public.reviews to anon;

create index if not exists bars_city_neighborhood_idx
on public.bars (city, neighborhood);

create index if not exists reviews_bar_created_idx
on public.reviews (bar_id, created_at desc);
