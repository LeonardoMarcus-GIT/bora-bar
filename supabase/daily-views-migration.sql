-- Bora Bar - Visitas por dia para o gráfico do painel (30/10/2026). Só adiciona.
-- Devolve, para os últimos N dias (no horário de Brasília), quantas visitas a
-- página do bar teve em cada dia, incluindo os dias com zero.
-- Só quem administra o bar pode ler (is_bar_manager), como get_bar_metrics.

create or replace function public.get_bar_daily_views(
  target_bar_id text,
  day_count integer default 7
)
returns table(day date, total bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  today date := (now() at time zone 'America/Sao_Paulo')::date;
  safe_days integer := least(greatest(coalesce(day_count, 7), 1), 31);
begin
  if not public.is_bar_manager(target_bar_id) then
    raise exception 'Not allowed to read metrics for this bar.';
  end if;

  return query
  select days.day::date, count(engagement.id)::bigint
  from generate_series(today - (safe_days - 1), today, interval '1 day') as days(day)
  left join public.bar_engagement_events engagement
    on engagement.bar_id = target_bar_id
    and engagement.event_type = 'view'
    and (engagement.created_at at time zone 'America/Sao_Paulo')::date = days.day::date
  group by days.day
  order by days.day;
end;
$$;

revoke all on function public.get_bar_daily_views(text, integer) from public, anon;
grant execute on function public.get_bar_daily_views(text, integer) to authenticated;
