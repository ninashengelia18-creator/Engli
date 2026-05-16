-- ============================================================
-- ENGLI HEARTS REFILL BATCH (2026-05-16)
--
-- The existing refill_hearts() function is per-user and auth.uid()-bound,
-- so the client only refills when the user has the app open. That means a
-- player who depleted hearts and walked away never sees them come back.
--
-- This migration adds a service-role-only batch function that refills any
-- profile that has been at 4+ hours past hearts_refilled_at, and is called
-- from a cron endpoint (see /api/cron/refill-hearts).
-- ============================================================

create or replace function public.refill_hearts_batch()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  affected int;
begin
  with updated as (
    update public.profiles
       set hearts = least(5,
             hearts + floor(extract(epoch from (now() - hearts_refilled_at)) / 3600.0 / 4.0)::int
           ),
           hearts_refilled_at = now()
     where hearts < 5
       and extract(epoch from (now() - hearts_refilled_at)) / 3600.0 >= 4
    returning 1
  )
  select count(*) into affected from updated;
  return affected;
end;
$$;

-- Service-role only — not exposed to authenticated users. Service role
-- bypasses RLS and grants, so the explicit revoke from PUBLIC is the
-- meaningful line here.
revoke all on function public.refill_hearts_batch() from public;
