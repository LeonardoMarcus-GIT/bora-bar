-- Bora Bar - estrutura inicial do Supabase
-- Rode este arquivo no SQL Editor do Supabase.

create table if not exists public.bars (
  id text primary key,
  name text not null,
  neighborhood text not null,
  city text not null,
  image_url text not null,
  distance_km numeric(5, 2) not null default 0,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  is_active boolean not null default true,
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
  user_id uuid references auth.users(id) on delete cascade,
  author text not null,
  comment text not null,
  rating integer not null check (rating between 1 and 5),
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  state text,
  state_code text,
  city text,
  city_ibge_code text,
  neighborhood text,
  postal_code text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  location_source text,
  location_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bars enable row level security;
alter table public.reviews enable row level security;
alter table public.profiles enable row level security;

alter table public.reviews
add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.bars
add column if not exists latitude numeric(10, 7);

alter table public.bars
add column if not exists longitude numeric(10, 7);

alter table public.bars
add column if not exists is_active boolean not null default true;

alter table public.profiles
add column if not exists state text;

alter table public.profiles
add column if not exists state_code text;

alter table public.profiles
add column if not exists city_ibge_code text;

alter table public.profiles
add column if not exists postal_code text;

alter table public.profiles
add column if not exists latitude numeric(10, 7);

alter table public.profiles
add column if not exists longitude numeric(10, 7);

alter table public.profiles
add column if not exists location_source text;

alter table public.profiles
add column if not exists location_updated_at timestamptz;

drop policy if exists "Anyone can read bars" on public.bars;
create policy "Anyone can read bars"
on public.bars
for select
to anon, authenticated
using (true);

drop policy if exists "Anyone can read reviews" on public.reviews;
create policy "Anyone can read reviews"
on public.reviews
for select
to anon, authenticated
using (true);

drop policy if exists "Anyone can create reviews" on public.reviews;
drop policy if exists "Logged in users can create reviews" on public.reviews;
create policy "Logged in users can create reviews"
on public.reviews
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and length(trim(author)) between 2 and 80
  and length(trim(comment)) between 2 and 600
  and rating between 1 and 5
);

drop policy if exists "Users can delete own reviews" on public.reviews;
create policy "Users can delete own reviews"
on public.reviews
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

revoke insert, delete on public.reviews from anon;

grant select on public.bars to anon;
grant select on public.bars to authenticated;
grant select on public.reviews to anon;
grant select, insert, delete on public.reviews to authenticated;
grant select, insert, update on public.profiles to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    display_name,
    state,
    state_code,
    city,
    city_ibge_code,
    neighborhood,
    postal_code,
    latitude,
    longitude,
    location_source,
    location_updated_at
  )
  values (
    new.id,
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'state',
    new.raw_user_meta_data ->> 'state_code',
    new.raw_user_meta_data ->> 'city',
    new.raw_user_meta_data ->> 'city_ibge_code',
    new.raw_user_meta_data ->> 'neighborhood',
    new.raw_user_meta_data ->> 'postal_code',
    nullif(new.raw_user_meta_data ->> 'latitude', '')::numeric,
    nullif(new.raw_user_meta_data ->> 'longitude', '')::numeric,
    new.raw_user_meta_data ->> 'location_source',
    nullif(new.raw_user_meta_data ->> 'location_updated_at', '')::timestamptz
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.prepare_review_insert()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  reviewer_name text;
  reviewer_email text;
begin
  if auth.uid() is null then
    raise exception 'Login required to create a review.';
  end if;

  select nullif(trim(display_name), '')
  into reviewer_name
  from public.profiles
  where id = auth.uid();

  reviewer_email := nullif(auth.jwt() ->> 'email', '');

  new.user_id := auth.uid();
  new.author := coalesce(
    reviewer_name,
    nullif(split_part(coalesce(reviewer_email, ''), '@', 1), ''),
    'Usuario'
  );

  return new;
end;
$$;

drop trigger if exists before_review_insert on public.reviews;
create trigger before_review_insert
before insert on public.reviews
for each row execute procedure public.prepare_review_insert();

create index if not exists bars_city_neighborhood_idx
on public.bars (city, neighborhood);

create index if not exists bars_coordinates_idx
on public.bars (latitude, longitude);

create index if not exists reviews_bar_created_idx
on public.reviews (bar_id, created_at desc);

create index if not exists reviews_user_created_idx
on public.reviews (user_id, created_at desc);

create index if not exists profiles_location_idx
on public.profiles (latitude, longitude);

create index if not exists profiles_postal_code_idx
on public.profiles (postal_code);
