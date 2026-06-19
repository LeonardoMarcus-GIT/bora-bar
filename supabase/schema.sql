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
  postal_code text,
  street text,
  address_number text,
  address_complement text,
  state text,
  state_code text,
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

create table if not exists public.bar_claims (
  id uuid primary key default gen_random_uuid(),
  bar_id text not null references public.bars(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_name text not null,
  contact_phone text not null,
  business_document text,
  message text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bar_members (
  bar_id text not null references public.bars(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner'
    check (role in ('owner', 'manager', 'staff')),
  created_at timestamptz not null default now(),
  primary key (bar_id, user_id)
);

create table if not exists public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  bar_id text not null references public.bars(id) on delete cascade,
  name text not null,
  slug text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  bar_id text not null references public.bars(id) on delete cascade,
  category_id uuid not null references public.menu_categories(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10, 2) not null default 0 check (price >= 0),
  is_available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  bar_id text not null references public.bars(id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bar_events (
  id uuid primary key default gen_random_uuid(),
  bar_id text not null references public.bars(id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  price numeric(10, 2) check (price is null or price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bars enable row level security;
alter table public.reviews enable row level security;
alter table public.profiles enable row level security;
alter table public.bar_claims enable row level security;
alter table public.bar_members enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.promotions enable row level security;
alter table public.bar_events enable row level security;

alter table public.reviews
add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.bars
add column if not exists latitude numeric(10, 7);

alter table public.bars
add column if not exists longitude numeric(10, 7);

alter table public.bars
add column if not exists is_active boolean not null default true;

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

create or replace function public.is_bar_manager(target_bar_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.bar_members
    where bar_id = target_bar_id
      and user_id = (select auth.uid())
      and role in ('owner', 'manager')
  );
$$;

revoke all on function public.is_bar_manager(text) from public;
grant execute on function public.is_bar_manager(text) to anon;
grant execute on function public.is_bar_manager(text) to authenticated;

drop policy if exists "Anyone can read bars" on public.bars;
create policy "Anyone can read bars"
on public.bars
for select
to anon, authenticated
using (true);

drop policy if exists "Managers can update own bars" on public.bars;
create policy "Managers can update own bars"
on public.bars
for update
to authenticated
using (public.is_bar_manager(id))
with check (public.is_bar_manager(id));

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

drop policy if exists "Users can read own claims" on public.bar_claims;
create policy "Users can read own claims"
on public.bar_claims
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create own claims" on public.bar_claims;
create policy "Users can create own claims"
on public.bar_claims
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and status = 'pending'
);

drop policy if exists "Users can read own memberships" on public.bar_members;
create policy "Users can read own memberships"
on public.bar_members
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Anyone can read active menu categories" on public.menu_categories;
create policy "Anyone can read active menu categories"
on public.menu_categories
for select
to anon, authenticated
using (is_active or public.is_bar_manager(bar_id));

drop policy if exists "Managers can create menu categories" on public.menu_categories;
create policy "Managers can create menu categories"
on public.menu_categories
for insert
to authenticated
with check (public.is_bar_manager(bar_id));

drop policy if exists "Managers can update menu categories" on public.menu_categories;
create policy "Managers can update menu categories"
on public.menu_categories
for update
to authenticated
using (public.is_bar_manager(bar_id))
with check (public.is_bar_manager(bar_id));

drop policy if exists "Managers can delete menu categories" on public.menu_categories;
create policy "Managers can delete menu categories"
on public.menu_categories
for delete
to authenticated
using (public.is_bar_manager(bar_id));

drop policy if exists "Anyone can read available menu items" on public.menu_items;
create policy "Anyone can read available menu items"
on public.menu_items
for select
to anon, authenticated
using (is_available or public.is_bar_manager(bar_id));

drop policy if exists "Managers can create menu items" on public.menu_items;
create policy "Managers can create menu items"
on public.menu_items
for insert
to authenticated
with check (public.is_bar_manager(bar_id));

drop policy if exists "Managers can update menu items" on public.menu_items;
create policy "Managers can update menu items"
on public.menu_items
for update
to authenticated
using (public.is_bar_manager(bar_id))
with check (public.is_bar_manager(bar_id));

drop policy if exists "Managers can delete menu items" on public.menu_items;
create policy "Managers can delete menu items"
on public.menu_items
for delete
to authenticated
using (public.is_bar_manager(bar_id));

drop policy if exists "Anyone can read current promotions" on public.promotions;
create policy "Anyone can read current promotions"
on public.promotions
for select
to anon, authenticated
using (
  (
    is_active
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
  )
  or public.is_bar_manager(bar_id)
);

drop policy if exists "Managers can manage promotions" on public.promotions;
create policy "Managers can manage promotions"
on public.promotions
for all
to authenticated
using (public.is_bar_manager(bar_id))
with check (public.is_bar_manager(bar_id));

drop policy if exists "Anyone can read upcoming events" on public.bar_events;
create policy "Anyone can read upcoming events"
on public.bar_events
for select
to anon, authenticated
using (
  (
    is_active
    and coalesce(ends_at, starts_at) >= now()
  )
  or public.is_bar_manager(bar_id)
);

drop policy if exists "Managers can manage events" on public.bar_events;
create policy "Managers can manage events"
on public.bar_events
for all
to authenticated
using (public.is_bar_manager(bar_id))
with check (public.is_bar_manager(bar_id));

revoke insert, delete on public.reviews from anon;

grant select on public.bars to anon;
grant select on public.bars to authenticated;
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
grant select on public.reviews to anon;
grant select, insert, delete on public.reviews to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert on public.bar_claims to authenticated;
grant select on public.bar_members to authenticated;
grant select on public.menu_categories to anon;
grant select, insert, update, delete on public.menu_categories to authenticated;
grant select on public.menu_items to anon;
grant select, insert, update, delete on public.menu_items to authenticated;
grant select on public.promotions to anon;
grant select, insert, update, delete on public.promotions to authenticated;
grant select on public.bar_events to anon;
grant select, insert, update, delete on public.bar_events to authenticated;

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

create or replace function public.handle_approved_bar_claim()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    insert into public.bar_members (bar_id, user_id, role)
    values (new.bar_id, new.user_id, 'owner')
    on conflict (bar_id, user_id) do nothing;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists on_bar_claim_approved on public.bar_claims;
create trigger on_bar_claim_approved
before update on public.bar_claims
for each row execute procedure public.handle_approved_bar_claim();

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

create or replace function public.replace_bar_menu(
  target_bar_id text,
  categories jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  category_data jsonb;
  item_data jsonb;
  inserted_category_id uuid;
  category_name text;
begin
  if not public.is_bar_manager(target_bar_id) then
    raise exception 'Not allowed to manage this bar.';
  end if;

  delete from public.menu_categories where bar_id = target_bar_id;

  for category_data in
    select value from jsonb_array_elements(coalesce(categories, '[]'::jsonb))
  loop
    category_name := trim(category_data ->> 'name');

    if category_name = '' then
      continue;
    end if;

    insert into public.menu_categories (
      bar_id,
      name,
      slug,
      sort_order,
      is_active
    )
    values (
      target_bar_id,
      category_name,
      coalesce(
        nullif(trim(category_data ->> 'slug'), ''),
        lower(replace(category_name, ' ', '-'))
      ),
      coalesce((category_data ->> 'sortOrder')::integer, 0),
      coalesce((category_data ->> 'isActive')::boolean, true)
    )
    returning id into inserted_category_id;

    for item_data in
      select value
      from jsonb_array_elements(coalesce(category_data -> 'items', '[]'::jsonb))
    loop
      if trim(item_data ->> 'name') = '' then
        continue;
      end if;

      insert into public.menu_items (
        bar_id,
        category_id,
        name,
        description,
        price,
        is_available,
        sort_order
      )
      values (
        target_bar_id,
        inserted_category_id,
        trim(item_data ->> 'name'),
        nullif(trim(item_data ->> 'description'), ''),
        greatest(coalesce((item_data ->> 'price')::numeric, 0), 0),
        coalesce((item_data ->> 'isAvailable')::boolean, true),
        coalesce((item_data ->> 'sortOrder')::integer, 0)
      );
    end loop;
  end loop;
end;
$$;

revoke all on function public.replace_bar_menu(text, jsonb) from public;
grant execute on function public.replace_bar_menu(text, jsonb) to authenticated;

create or replace function public.replace_bar_promotions(
  target_bar_id text,
  promotion_list jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  promotion_data jsonb;
begin
  if not public.is_bar_manager(target_bar_id) then
    raise exception 'Not allowed to manage this bar.';
  end if;

  delete from public.promotions where bar_id = target_bar_id;

  for promotion_data in
    select value from jsonb_array_elements(coalesce(promotion_list, '[]'::jsonb))
  loop
    if trim(promotion_data ->> 'title') = '' then
      continue;
    end if;

    insert into public.promotions (
      bar_id,
      title,
      description,
      starts_at,
      ends_at,
      is_active
    )
    values (
      target_bar_id,
      trim(promotion_data ->> 'title'),
      nullif(trim(promotion_data ->> 'description'), ''),
      nullif(promotion_data ->> 'startsAt', '')::timestamptz,
      nullif(promotion_data ->> 'endsAt', '')::timestamptz,
      coalesce((promotion_data ->> 'isActive')::boolean, true)
    );
  end loop;
end;
$$;

revoke all on function public.replace_bar_promotions(text, jsonb) from public;
grant execute on function public.replace_bar_promotions(text, jsonb) to authenticated;

create or replace function public.replace_bar_events(
  target_bar_id text,
  event_list jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  event_data jsonb;
begin
  if not public.is_bar_manager(target_bar_id) then
    raise exception 'Not allowed to manage this bar.';
  end if;

  delete from public.bar_events where bar_id = target_bar_id;

  for event_data in
    select value from jsonb_array_elements(coalesce(event_list, '[]'::jsonb))
  loop
    if
      trim(event_data ->> 'title') = ''
      or nullif(event_data ->> 'startsAt', '') is null
    then
      continue;
    end if;

    insert into public.bar_events (
      bar_id,
      title,
      description,
      starts_at,
      ends_at,
      price,
      is_active
    )
    values (
      target_bar_id,
      trim(event_data ->> 'title'),
      nullif(trim(event_data ->> 'description'), ''),
      (event_data ->> 'startsAt')::timestamptz,
      nullif(event_data ->> 'endsAt', '')::timestamptz,
      nullif(event_data ->> 'price', '')::numeric,
      coalesce((event_data ->> 'isActive')::boolean, true)
    );
  end loop;
end;
$$;

revoke all on function public.replace_bar_events(text, jsonb) from public;
grant execute on function public.replace_bar_events(text, jsonb) to authenticated;

create index if not exists bars_city_neighborhood_idx
on public.bars (city, neighborhood);

create index if not exists bars_coordinates_idx
on public.bars (latitude, longitude);

create index if not exists bars_postal_code_idx
on public.bars (postal_code);

create index if not exists reviews_bar_created_idx
on public.reviews (bar_id, created_at desc);

create index if not exists reviews_user_created_idx
on public.reviews (user_id, created_at desc);

create index if not exists profiles_location_idx
on public.profiles (latitude, longitude);

create index if not exists profiles_postal_code_idx
on public.profiles (postal_code);

create unique index if not exists bar_claims_one_pending_per_user_bar_idx
on public.bar_claims (bar_id, user_id)
where status = 'pending';

create index if not exists bar_claims_status_created_idx
on public.bar_claims (status, created_at desc);

create index if not exists bar_members_user_idx
on public.bar_members (user_id, created_at desc);

create index if not exists menu_categories_bar_sort_idx
on public.menu_categories (bar_id, sort_order);

create index if not exists menu_items_category_sort_idx
on public.menu_items (category_id, sort_order);

create index if not exists promotions_bar_dates_idx
on public.promotions (bar_id, starts_at, ends_at);

create index if not exists bar_events_bar_start_idx
on public.bar_events (bar_id, starts_at);
