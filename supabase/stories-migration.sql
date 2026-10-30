-- Bora Bar - Stories, etapa 1 (30/10/2026). Só adiciona; não apaga nada.
-- 1) Foto opcional em cada promoção e evento: vira o fundo do story no app.
-- 2) Métricas dos stories: 'story_view' (alguém viu o story do bar) e
--    'story_open' (tocou em "Ver o bar" dentro do story). Como as outras métricas,
--    guardam só bar + tipo + id de sessão anônimo.

alter table public.promotions add column if not exists image_url text;
alter table public.bar_events add column if not exists image_url text;

alter table public.bar_engagement_events
drop constraint if exists bar_engagement_events_event_type_check;

alter table public.bar_engagement_events
add constraint bar_engagement_events_event_type_check
check (event_type in (
  'view',
  'whatsapp',
  'phone',
  'route_google',
  'route_waze',
  'favorite',
  'story_view',
  'story_open'
));

drop policy if exists "Anyone can record safe bar engagement" on public.bar_engagement_events;
create policy "Anyone can record safe bar engagement"
on public.bar_engagement_events
for insert
to anon, authenticated
with check (
  event_type in (
    'view',
    'whatsapp',
    'phone',
    'route_google',
    'route_waze',
    'favorite',
    'story_view',
    'story_open'
  )
);

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
      image_url,
      starts_at,
      ends_at,
      is_active
    )
    values (
      target_bar_id,
      trim(promotion_data ->> 'title'),
      nullif(trim(promotion_data ->> 'description'), ''),
      nullif(trim(promotion_data ->> 'imageUrl'), ''),
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
      image_url,
      starts_at,
      ends_at,
      price,
      is_active
    )
    values (
      target_bar_id,
      trim(event_data ->> 'title'),
      nullif(trim(event_data ->> 'description'), ''),
      nullif(trim(event_data ->> 'imageUrl'), ''),
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
