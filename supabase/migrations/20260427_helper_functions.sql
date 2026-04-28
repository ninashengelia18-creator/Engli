-- ============================================================
-- ENGLI HELPER FUNCTIONS (run after initial schema)
-- ============================================================

-- Decrement hearts atomically, with floor at 0
create or replace function public.decrement_hearts(p_user_id uuid)
returns int language plpgsql security definer as $$
declare new_hearts int;
begin
  update public.profiles
  set hearts = greatest(0, hearts - 1),
      hearts_refilled_at = case when hearts = 5 then now() else hearts_refilled_at end
  where id = p_user_id
  returning hearts into new_hearts;
  return new_hearts;
end;
$$;

-- Refill hearts (called by cron or client when 4hr have passed)
create or replace function public.refill_hearts(p_user_id uuid)
returns int language plpgsql security definer as $$
declare
  current_hearts int;
  refilled_at timestamptz;
  hours_passed numeric;
  to_add int;
  new_hearts int;
begin
  select hearts, hearts_refilled_at into current_hearts, refilled_at
  from public.profiles where id = p_user_id;

  if current_hearts >= 5 then return 5; end if;

  hours_passed := extract(epoch from (now() - refilled_at)) / 3600.0;
  to_add := least(5 - current_hearts, floor(hours_passed / 4)::int);

  if to_add > 0 then
    update public.profiles
    set hearts = current_hearts + to_add,
        hearts_refilled_at = now()
    where id = p_user_id
    returning hearts into new_hearts;
    return new_hearts;
  end if;
  return current_hearts;
end;
$$;

-- Get current week's leaderboard for a user's league
create or replace function public.weekly_leaderboard(p_limit int default 30)
returns table (
  user_id uuid,
  display_name text,
  child_name text,
  weekly_xp bigint,
  current_streak int
) language sql stable as $$
  select
    p.id as user_id,
    p.display_name,
    p.child_name,
    coalesce(sum(d.xp_earned), 0)::bigint as weekly_xp,
    p.current_streak
  from public.profiles p
  left join public.daily_xp d
    on d.user_id = p.id
    and d.date >= date_trunc('week', current_date)::date
  group by p.id
  order by weekly_xp desc
  limit p_limit;
$$;
