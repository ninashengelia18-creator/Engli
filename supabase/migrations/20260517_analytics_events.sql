-- Lightweight product analytics table. Used by src/lib/analytics.ts.
-- Inserts are best-effort and must never gate learning.

create table if not exists public.analytics_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  name        text not null,
  props       jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists analytics_events_user_idx
  on public.analytics_events (user_id, created_at desc);
create index if not exists analytics_events_name_idx
  on public.analytics_events (name, created_at desc);

alter table public.analytics_events enable row level security;

-- Users can write their own events; service role can read everything.
drop policy if exists "analytics insert own" on public.analytics_events;
create policy "analytics insert own"
  on public.analytics_events
  for insert
  to authenticated
  with check (user_id is null or user_id = auth.uid());

drop policy if exists "analytics read own" on public.analytics_events;
create policy "analytics read own"
  on public.analytics_events
  for select
  to authenticated
  using (user_id = auth.uid());

-- Default user_id to the calling auth.uid() so callers don't have to send it.
create or replace function public.set_analytics_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists set_analytics_user_trg on public.analytics_events;
create trigger set_analytics_user_trg
  before insert on public.analytics_events
  for each row execute function public.set_analytics_user();
