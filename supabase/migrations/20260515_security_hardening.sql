-- ============================================================
-- ENGLI SECURITY HARDENING (2026-05-15)
--
-- Problem: The existing award_xp(p_user_id) and decrement_hearts(p_user_id)
-- functions are SECURITY DEFINER and trust a user_id argument passed by the
-- client. Any authenticated user can therefore award arbitrary XP to any
-- account (or burn another user's hearts) by calling the RPC with a forged
-- user_id. This migration replaces those signatures with auth.uid()-bound
-- variants that the client cannot spoof.
--
-- It also introduces processed_stripe_events for webhook idempotency and
-- complete_lesson() — an atomic, server-validated lesson-completion RPC.
-- ============================================================

-- ---- award_xp: bind to caller via auth.uid() ----------------
-- Replace the old signature outright. We also clamp the XP grant so a
-- malicious caller can't smuggle an absurd amount through the rate-limited
-- complete_lesson() path.
drop function if exists public.award_xp(uuid, int);

create or replace function public.award_xp(p_xp int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  today date := current_date;
  last_date date;
  clamped_xp int;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;
  -- Defensive clamp: a single award is never more than 100 XP.
  clamped_xp := greatest(0, least(coalesce(p_xp, 0), 100));
  if clamped_xp = 0 then return; end if;

  select last_active_date into last_date from public.profiles where id = uid;

  if last_date is null or last_date < today - interval '1 day' then
    update public.profiles
      set current_streak = 1,
          last_active_date = today,
          xp = xp + clamped_xp
      where id = uid;
  elsif last_date = today - interval '1 day' then
    update public.profiles
      set current_streak = current_streak + 1,
          longest_streak = greatest(longest_streak, current_streak + 1),
          last_active_date = today,
          xp = xp + clamped_xp
      where id = uid;
  else
    update public.profiles
      set xp = xp + clamped_xp,
          last_active_date = today
      where id = uid;
  end if;

  insert into public.daily_xp (user_id, date, xp_earned, lessons_completed)
  values (uid, today, clamped_xp, 1)
  on conflict (user_id, date) do update set
    xp_earned = public.daily_xp.xp_earned + clamped_xp,
    lessons_completed = public.daily_xp.lessons_completed + 1;
end;
$$;

revoke all on function public.award_xp(int) from public;
grant execute on function public.award_xp(int) to authenticated;

-- ---- decrement_hearts: bind to caller via auth.uid() --------
drop function if exists public.decrement_hearts(uuid);

create or replace function public.decrement_hearts()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  new_hearts int;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;
  update public.profiles
    set hearts = greatest(0, hearts - 1),
        hearts_refilled_at = case when hearts = 5 then now() else hearts_refilled_at end
    where id = uid
    returning hearts into new_hearts;
  return new_hearts;
end;
$$;

revoke all on function public.decrement_hearts() from public;
grant execute on function public.decrement_hearts() to authenticated;

-- ---- refill_hearts: bind to caller via auth.uid() -----------
drop function if exists public.refill_hearts(uuid);

create or replace function public.refill_hearts()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  current_hearts int;
  refilled_at timestamptz;
  hours_passed numeric;
  to_add int;
  new_hearts int;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;
  select hearts, hearts_refilled_at into current_hearts, refilled_at
    from public.profiles where id = uid;
  if current_hearts >= 5 then return 5; end if;
  hours_passed := extract(epoch from (now() - refilled_at)) / 3600.0;
  to_add := least(5 - current_hearts, floor(hours_passed / 4)::int);
  if to_add > 0 then
    update public.profiles
      set hearts = current_hearts + to_add,
          hearts_refilled_at = now()
      where id = uid
      returning hearts into new_hearts;
    return new_hearts;
  end if;
  return current_hearts;
end;
$$;

revoke all on function public.refill_hearts() from public;
grant execute on function public.refill_hearts() to authenticated;

-- ---- complete_lesson: atomic, server-validated finish -------
-- Validates that the lesson is published before granting XP. Returns the
-- canonical xp_reward of the lesson so the client can display it without
-- being able to choose it.
create or replace function public.complete_lesson(
  p_lesson_id uuid,
  p_mistakes int,
  p_seconds int
) returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  lesson_xp int;
  score int;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  select xp_reward into lesson_xp
    from public.lessons
    where id = p_lesson_id and is_published = true;

  if lesson_xp is null then
    raise exception 'lesson not found or not published';
  end if;

  score := greatest(0, 100 - greatest(coalesce(p_mistakes, 0), 0) * 10);

  insert into public.lesson_progress (
    user_id, lesson_id, status, best_score, attempts,
    total_time_seconds, first_completed_at, last_attempted_at
  )
  values (
    uid, p_lesson_id, 'completed', score, 1,
    greatest(coalesce(p_seconds, 0), 0), now(), now()
  )
  on conflict (user_id, lesson_id) do update set
    status = 'completed',
    best_score = greatest(public.lesson_progress.best_score, excluded.best_score),
    attempts = public.lesson_progress.attempts + 1,
    total_time_seconds = public.lesson_progress.total_time_seconds + excluded.total_time_seconds,
    first_completed_at = coalesce(public.lesson_progress.first_completed_at, excluded.first_completed_at),
    last_attempted_at = excluded.last_attempted_at;

  perform public.award_xp(lesson_xp);

  return lesson_xp;
end;
$$;

revoke all on function public.complete_lesson(uuid, int, int) from public;
grant execute on function public.complete_lesson(uuid, int, int) to authenticated;

-- ---- processed_stripe_events: webhook idempotency ----------
-- Stripe re-delivers webhook events on transient failures. Without
-- idempotency we'd double-count subscription state transitions.
create table if not exists public.processed_stripe_events (
  id text primary key,
  event_type text not null,
  processed_at timestamptz default now()
);

alter table public.processed_stripe_events enable row level security;
-- No policies: only service-role (which bypasses RLS) writes here.
