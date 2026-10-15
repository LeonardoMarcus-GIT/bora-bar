-- Bora Bar - Pratos do dia editáveis pelo dono
-- Rode uma vez no SQL Editor (já aplicado no projeto em 15/10/2026).
-- Requer a coluna bars.gallery (listing-visibility-migration.sql).

create or replace function public.replace_bar_gallery(
  target_bar_id text,
  dish_list jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  dish jsonb;
  clean_list jsonb := '[]'::jsonb;
  dish_url text;
  dish_name text;
  dish_price numeric;
begin
  if not public.is_bar_manager(target_bar_id) then
    raise exception 'Not allowed to manage this bar.';
  end if;

  for dish in
    select value from jsonb_array_elements(coalesce(dish_list, '[]'::jsonb))
  loop
    dish_url := nullif(trim(dish ->> 'url'), '');
    dish_name := nullif(trim(dish ->> 'name'), '');

    if dish_url is null or dish_name is null then
      continue;
    end if;

    if jsonb_array_length(clean_list) >= 12 then
      exit;
    end if;

    dish_price := nullif(dish ->> 'price', '')::numeric;

    clean_list := clean_list || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
      'url', left(dish_url, 500),
      'name', left(dish_name, 80),
      'description', left(nullif(trim(dish ->> 'description'), ''), 200),
      'price', case when dish_price is null or dish_price < 0 then null else round(dish_price, 2) end
    )));
  end loop;

  update public.bars
  set gallery = clean_list, updated_at = now()
  where id = target_bar_id;
end;
$$;

revoke all on function public.replace_bar_gallery(text, jsonb) from public;
grant execute on function public.replace_bar_gallery(text, jsonb) to authenticated;

-- Converte o formato antigo {url, caption} para {url, name}.
update public.bars
set gallery = (
  select coalesce(jsonb_agg(
    jsonb_strip_nulls(jsonb_build_object(
      'url', photo ->> 'url',
      'name', coalesce(photo ->> 'name', photo ->> 'caption'),
      'description', photo ->> 'description',
      'price', photo -> 'price'
    ))
  ), '[]'::jsonb)
  from jsonb_array_elements(gallery) photo
)
where jsonb_array_length(gallery) > 0;
