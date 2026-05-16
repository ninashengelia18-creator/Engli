-- ============================================================
-- ENGLI LEAGUES — WEEKLY ROLLOVER (2026-05-19)
--
-- The initial schema seeded `leagues` and `league_participants` tables
-- but never wired them up: the Leagues UI was a global all-time XP list.
-- This migration introduces the tier ladder, the week boundaries, and
-- the rollover machinery needed to make weekly leagues real.
--
-- The design follows the well-known model: 5 tiers (Bronze → Diamond),
-- weekly weekly_xp leaderboards, top-N promote, bottom-N demote, the
-- rest stay. Rollover runs once per week against a service-role cron
-- endpoint (see /api/cron/league-rollover).
--
-- All functions are idempotent. Safe to re-run the migration.
-- ============================================================

-- 1. Make sure the leagues table has everything we need ----
alter table public.leagues
  add column if not exists tier_slug text,
  add column if not exists is_active boolean not null default true;

create unique index if not exists leagues_tier_week_idx
  on public.leagues(tier, start_date);

-- 2. Reference table of tiers --------------------------------
create table if not exists public.league_tiers (
  tier        int primary key,
  slug        text unique not null,
  name_en     text not null,
  name_ka     text not null,
  emoji       text not null,
  color       text not null,
  -- Promotion / demotion thresholds within a 30-player cohort:
  promote_top int not null default 7,
  demote_bot  int not null default 5
);

insert into public.league_tiers (tier, slug, name_en, name_ka, emoji, color, promote_top, demote_bot) values
  (1, 'bronze',   'Bronze League',   'ბრინჯაოს ლიგა',  '🥉', '#CD7F32', 7, 0),
  (2, 'silver',   'Silver League',   'ვერცხლის ლიგა',  '🥈', '#C0C0C0', 7, 5),
  (3, 'gold',     'Gold League',     'ოქროს ლიგა',     '🥇', '#FFD700', 7, 5),
  (4, 'sapphire', 'Sapphire League', 'საფირონის ლიგა', '💎', '#0F52BA', 7, 5),
  (5, 'diamond',  'Diamond League',  'ბრილიანტის ლიგა','💠', '#B9F2FF', 0, 5)
on conflict (tier) do update set
  slug = excluded.slug,
  name_en = excluded.name_en,
  name_ka = excluded.name_ka,
  emoji = excluded.emoji,
  color = excluded.color,
  promote_top = excluded.promote_top,
  demote_bot = excluded.demote_bot;

-- 3. Helper — current week boundary (Monday → Sunday, UTC) ---
create or replace function public.current_week_start()
returns date language sql immutable as $$
  select (date_trunc('week', current_date)::date)
$$;

create or replace function public.current_week_end()
returns date language sql immutable as $$
  select (date_trunc('week', current_date)::date + 6)
$$;

-- 4. Track which tier a user belongs to between weeks --------
alter table public.profiles
  add column if not exists current_league_tier int default 1;

-- 5. Ensure a league row exists for every tier this week -----
create or replace function public.ensure_current_leagues()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  ws date := public.current_week_start();
  we date := public.current_week_end();
  created int := 0;
  t record;
begin
  for t in select * from public.league_tiers loop
    insert into public.leagues (name, tier, emoji, start_date, end_date, tier_slug, is_active)
    values (t.name_en, t.tier, t.emoji, ws, we, t.slug, true)
    on conflict (tier, start_date) do nothing;
    if found then created := created + 1; end if;
  end loop;
  return created;
end;
$$;

revoke all on function public.ensure_current_leagues() from public;

-- 6. Enrollment — make sure caller is in the right league ----
-- Called from award_xp so every XP-earning user lands in a cohort.
create or replace function public.enroll_in_current_league(p_user_id uuid, p_xp_gain int default 0)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  ws date := public.current_week_start();
  user_tier int;
  target_league uuid;
begin
  perform public.ensure_current_leagues();

  select coalesce(current_league_tier, 1) into user_tier
    from public.profiles where id = p_user_id;
  if user_tier is null then user_tier := 1; end if;

  select id into target_league
    from public.leagues
    where tier = user_tier and start_date = ws and is_active = true
    limit 1;

  if target_league is null then return; end if;

  insert into public.league_participants (league_id, user_id, weekly_xp)
  values (target_league, p_user_id, greatest(p_xp_gain, 0))
  on conflict (league_id, user_id) do update set
    weekly_xp = public.league_participants.weekly_xp + greatest(p_xp_gain, 0);
end;
$$;

revoke all on function public.enroll_in_current_league(uuid, int) from public;

-- 7. Hook enrollment into award_xp ---------------------------
-- We re-create award_xp from the security-hardening migration to call
-- enroll_in_current_league once per XP grant. Behavior is otherwise the
-- same: auth.uid()-bound, clamped at 200 XP per call.
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

  clamped_xp := least(greatest(coalesce(p_xp, 0), 0), 200);

  select last_active_date into last_date from public.profiles where id = uid;

  if last_date is null or last_date < today - interval '1 day' then
    update public.profiles set
      current_streak = 1,
      last_active_date = today,
      xp = xp + clamped_xp
    where id = uid;
  elsif last_date = today - interval '1 day' then
    update public.profiles set
      current_streak = current_streak + 1,
      longest_streak = greatest(longest_streak, current_streak + 1),
      last_active_date = today,
      xp = xp + clamped_xp
    where id = uid;
  else
    update public.profiles set
      xp = xp + clamped_xp,
      last_active_date = today
    where id = uid;
  end if;

  insert into public.daily_xp (user_id, date, xp_earned, lessons_completed)
  values (uid, today, clamped_xp, 1)
  on conflict (user_id, date) do update set
    xp_earned = public.daily_xp.xp_earned + clamped_xp,
    lessons_completed = public.daily_xp.lessons_completed + 1;

  -- Weekly league enrollment + accumulation. Never blocks XP grant.
  begin
    perform public.enroll_in_current_league(uid, clamped_xp);
  exception when others then
    -- Leaderboards must not gate XP. Swallow.
    null;
  end;
end;
$$;

revoke all on function public.award_xp(int) from public;
grant execute on function public.award_xp(int) to authenticated;

-- 8. The rollover itself --------------------------------------
-- For the week ending today (or specified end_date), compute final
-- ranks for every active league, then for each participant:
--   * top promote_top  → next tier (capped at max tier)
--   * bottom demote_bot → previous tier (floored at tier 1)
--   * middle stays in same tier
-- Update profiles.current_league_tier, archive the league as inactive,
-- and pre-create next week's leagues.
create or replace function public.rollover_leagues(p_end_date date default null)
returns table(
  promoted int,
  demoted  int,
  stayed   int,
  archived_leagues int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_end date := coalesce(p_end_date, public.current_week_end());
  promoted_count int := 0;
  demoted_count int := 0;
  stayed_count int := 0;
  archived_count int := 0;
  max_tier int;
  lg record;
  ranked record;
begin
  select max(tier) into max_tier from public.league_tiers;

  for lg in
    select l.*, t.promote_top, t.demote_bot
      from public.leagues l
      join public.league_tiers t on t.tier = l.tier
     where l.end_date = target_end and l.is_active = true
  loop
    -- Compute ranks and bucket each participant.
    -- A 0-XP week stays in the same tier rather than getting demoted —
    -- early-stage user-friendly choice.
    for ranked in
      with ordered as (
        select user_id, weekly_xp,
               row_number() over (order by weekly_xp desc, user_id) as rk,
               count(*) over () as cohort_size
          from public.league_participants
         where league_id = lg.id
      )
      select * from ordered
    loop
      update public.league_participants
        set rank = ranked.rk
        where league_id = lg.id and user_id = ranked.user_id;

      if ranked.weekly_xp <= 0 then
        stayed_count := stayed_count + 1;
        -- no tier change
      elsif ranked.rk <= lg.promote_top and lg.tier < max_tier then
        update public.profiles
          set current_league_tier = least(max_tier, lg.tier + 1)
          where id = ranked.user_id;
        promoted_count := promoted_count + 1;
      elsif lg.demote_bot > 0
            and ranked.rk > ranked.cohort_size - lg.demote_bot
            and lg.tier > 1 then
        update public.profiles
          set current_league_tier = greatest(1, lg.tier - 1)
          where id = ranked.user_id;
        demoted_count := demoted_count + 1;
      else
        stayed_count := stayed_count + 1;
      end if;
    end loop;

    update public.leagues set is_active = false where id = lg.id;
    archived_count := archived_count + 1;
  end loop;

  -- Pre-seed next week's leagues so the next enroll call has rows.
  perform public.ensure_current_leagues();

  return query select promoted_count, demoted_count, stayed_count, archived_count;
end;
$$;

revoke all on function public.rollover_leagues(date) from public;

-- 9. Read-side helpers ---------------------------------------
-- A view that joins each participant in the active week's leagues to
-- profile display info. RLS allows authenticated users to read, but
-- they only see their *own* league's rows from the UI by filtering.
create or replace view public.v_current_league_standings as
select
  lp.league_id,
  lp.user_id,
  lp.weekly_xp,
  lp.rank,
  l.tier,
  l.tier_slug,
  l.start_date,
  l.end_date,
  p.child_name,
  p.display_name,
  p.current_streak
from public.league_participants lp
join public.leagues l on l.id = lp.league_id
join public.profiles p on p.id = lp.user_id
where l.is_active = true;

-- Bootstrap: create this week's leagues so the first run has cohorts.
select public.ensure_current_leagues();
