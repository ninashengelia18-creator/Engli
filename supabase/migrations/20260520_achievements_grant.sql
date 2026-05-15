-- ============================================================
-- ENGLI ACHIEVEMENTS — AUTO-GRANT + READ POLICY (2026-05-20)
--
-- The initial schema seeded 5 achievements but nothing ever inserts
-- into `user_achievements`. This migration:
--   1. Adds a public read policy for `achievements` (the catalog) so
--      authenticated users can see all available badges, not just the
--      ones they've earned.
--   2. Adds a `grant_eligible_achievements()` function that examines
--      the caller's progress and inserts any not-yet-granted entries.
--      The function is idempotent (relies on the unique constraint).
--   3. Wires complete_lesson() to call grant_eligible_achievements()
--      after award_xp() so badges land on the lesson-complete screen.
--
-- All idempotent; safe to re-run.
-- ============================================================

-- 1. Allow authenticated users to read the achievements catalog.
alter table public.achievements enable row level security;

drop policy if exists "Anyone authenticated reads achievements" on public.achievements;
create policy "Anyone authenticated reads achievements"
  on public.achievements
  for select
  to authenticated
  using (true);

-- 2. Also allow users to write their own user_achievements rows. The
-- function below is security definer, but having the policy makes
-- ad-hoc inserts from the client safe too.
drop policy if exists "Users insert own achievements" on public.user_achievements;
create policy "Users insert own achievements"
  on public.user_achievements
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- 3. Grant function. Reads the user's profile + progress and inserts
-- newly-earned achievements. Returns the slugs that were freshly
-- earned (for the client to celebrate).
create or replace function public.grant_eligible_achievements()
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  p record;
  completed_count int;
  perfect_count int;
  new_slugs text[] := array[]::text[];
  ach record;
  earned boolean;
begin
  if uid is null then
    return new_slugs;
  end if;

  select * into p from public.profiles where id = uid;
  if not found then return new_slugs; end if;

  select count(*) into completed_count
    from public.lesson_progress
   where user_id = uid and status in ('completed', 'mastered');

  select count(*) into perfect_count
    from public.lesson_progress
   where user_id = uid and best_score >= 100;

  for ach in select * from public.achievements loop
    earned := false;
    case ach.slug
      when 'first_lesson' then
        earned := completed_count >= 1;
      when 'week_streak' then
        earned := coalesce(p.current_streak, 0) >= 7
               or coalesce(p.longest_streak, 0) >= 7;
      when 'month_streak' then
        earned := coalesce(p.current_streak, 0) >= 30
               or coalesce(p.longest_streak, 0) >= 30;
      when 'hundred_words' then
        -- Rough proxy: completing 25 lessons ≈ 100 words exposed.
        earned := completed_count >= 25;
      when 'perfect_lesson' then
        earned := perfect_count >= 1;
      else
        earned := false;
    end case;

    if earned then
      insert into public.user_achievements (user_id, achievement_id)
      values (uid, ach.id)
      on conflict (user_id, achievement_id) do nothing;
      if found then
        new_slugs := array_append(new_slugs, ach.slug);
      end if;
    end if;
  end loop;

  return new_slugs;
end;
$$;

revoke all on function public.grant_eligible_achievements() from public;
grant execute on function public.grant_eligible_achievements() to authenticated;

-- 4. Hook the grant into complete_lesson so achievements appear on the
-- completion screen. We keep the original return shape (int = lesson XP)
-- to avoid breaking the existing API route; the client can call
-- grant_eligible_achievements() separately to learn what was earned.
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

  -- Best-effort: never block lesson completion on badge bookkeeping.
  begin
    perform public.grant_eligible_achievements();
  exception when others then
    null;
  end;

  return lesson_xp;
end;
$$;

revoke all on function public.complete_lesson(uuid, int, int) from public;
grant execute on function public.complete_lesson(uuid, int, int) to authenticated;
