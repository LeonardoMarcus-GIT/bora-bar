-- Bora Bar - foto opcional por item do cardápio
-- Rode uma vez no SQL Editor do Supabase. Só ADICIONA (não apaga nada).
-- 1) coluna menu_items.image_url
-- 2) replace_bar_menu passa a gravar a foto (imageUrl) de cada item;
--    sem isso, salvar o cardápio no painel apagaria as fotos.

alter table public.menu_items
add column if not exists image_url text;

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
        sort_order,
        image_url
      )
      values (
        target_bar_id,
        inserted_category_id,
        trim(item_data ->> 'name'),
        nullif(trim(item_data ->> 'description'), ''),
        greatest(coalesce((item_data ->> 'price')::numeric, 0), 0),
        coalesce((item_data ->> 'isAvailable')::boolean, true),
        coalesce((item_data ->> 'sortOrder')::integer, 0),
        left(nullif(trim(item_data ->> 'imageUrl'), ''), 500)
      );
    end loop;
  end loop;
end;
$$;

revoke all on function public.replace_bar_menu(text, jsonb) from public;
grant execute on function public.replace_bar_menu(text, jsonb) to authenticated;

-- Fotos do Cantinho Português (opcional, só para o piloto):
-- update public.menu_items set image_url = '/estabelecimentos/cantinho-portugues/item-bacalhau-legumes.jpg'
--   where bar_id = 'cantinho-portugues' and name = 'Bacalhau com legumes';
-- (ver docs/BANCO-DE-DADOS.md para a lista completa)
