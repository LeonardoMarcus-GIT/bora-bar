-- Bora Bar - Fotos de story expiram em 8 horas (30/10/2026).
-- As fotos de story ficam em bar-images/<bar_id>/stories/. De hora em hora o
-- pg_cron chama a Edge Function "limpar-stories" (supabase/functions/limpar-stories),
-- que apaga pelo Storage as fotos com mais de 8 horas e tira o link delas da
-- promoção/evento (o story volta a usar a capa do bar). A promoção e o evento ficam.
-- Apagar direto em storage.objects por SQL deixaria o arquivo perdido no bucket,
-- por isso a remoção é feita pela função, com a API do Storage.

-- Lista as fotos de story vencidas (só a função de limpeza, com a chave de serviço, chama).
create or replace function public.list_expired_story_images(max_age interval default interval '8 hours')
returns table(path text)
language sql
stable
security definer
set search_path = public, storage
as $$
  select objects.name
  from storage.objects objects
  where objects.bucket_id = 'bar-images'
    and split_part(objects.name, '/', 2) = 'stories'
    and objects.created_at < now() - max_age
  order by objects.created_at
  limit 1000;
$$;

revoke all on function public.list_expired_story_images(interval) from public, anon, authenticated;
grant execute on function public.list_expired_story_images(interval) to service_role;

-- Tira das promoções/eventos o link das fotos que foram apagadas.
create or replace function public.clear_story_image_urls(paths text[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  removed_path text;
begin
  foreach removed_path in array coalesce(paths, '{}') loop
    update public.promotions
    set image_url = null, updated_at = now()
    where image_url like '%/bar-images/' || removed_path;

    update public.bar_events
    set image_url = null, updated_at = now()
    where image_url like '%/bar-images/' || removed_path;
  end loop;
end;
$$;

revoke all on function public.clear_story_image_urls(text[]) from public, anon, authenticated;
grant execute on function public.clear_story_image_urls(text[]) to service_role;

-- Agendamento: a cada hora, no minuto 7.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('limpar-stories')
where exists (select 1 from cron.job where jobname = 'limpar-stories');

select cron.schedule(
  'limpar-stories',
  '7 * * * *',
  $$
  select net.http_post(
    url := 'https://ovwhjngjismvlwhoqtmr.supabase.co/functions/v1/limpar-stories',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
