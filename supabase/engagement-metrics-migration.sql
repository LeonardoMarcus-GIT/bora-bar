create table if not exists public.bar_engagement_events (
  id uuid primary key default gen_random_uuid(),
  bar_id text not null references public.bars(id) on delete cascade,
  event_type text not null
    check (event_type in (
      'view',
      'whatsapp',
      'phone',
      'route_google',
      'route_waze',
      'favorite'
    )),
  session_id uuid not null,
  created_at timestamptz not null default now()
);

alter table public.bar_engagement_events enable row level security;

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
    'favorite'
  )
);

drop policy if exists "Managers can read own bar engagement" on public.bar_engagement_events;
create policy "Managers can read own bar engagement"
on public.bar_engagement_events
for select
to authenticated
using (public.is_bar_manager(bar_id));

create or replace function public.get_bar_metrics(
  target_bar_id text,
  since_at timestamptz
)
returns table(event_type text, total bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_bar_manager(target_bar_id) then
    raise exception 'Not allowed to read metrics for this bar.';
  end if;

  return query
  select engagement.event_type, count(*)::bigint
  from public.bar_engagement_events engagement
  where engagement.bar_id = target_bar_id
    and engagement.created_at >= since_at
  group by engagement.event_type;
end;
$$;

revoke all on function public.get_bar_metrics(text, timestamptz) from public;
grant execute on function public.get_bar_metrics(text, timestamptz) to authenticated;

grant insert on public.bar_engagement_events to anon;
grant select, insert on public.bar_engagement_events to authenticated;

create index if not exists bar_engagement_bar_created_idx
on public.bar_engagement_events (bar_id, created_at desc);

create index if not exists bar_engagement_type_created_idx
on public.bar_engagement_events (event_type, created_at desc);
