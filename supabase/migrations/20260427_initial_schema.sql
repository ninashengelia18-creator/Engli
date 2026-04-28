-- ============================================================
-- ENGLI DATABASE SCHEMA
-- Run this in Supabase SQL Editor on a NEW project
-- ============================================================

-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- ============================================================
-- USERS & PROFILES
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text unique,
  display_name text,
  avatar_url text,
  child_name text,
  child_age int check (child_age between 4 and 18),
  parent_phone text,
  preferred_language text default 'ka' check (preferred_language in ('ka', 'en')),
  hearts int default 5 check (hearts between 0 and 5),
  hearts_refilled_at timestamptz default now(),
  gems int default 0,
  xp int default 0,
  current_streak int default 0,
  longest_streak int default 0,
  last_active_date date,
  streak_freezes int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index profiles_xp_idx on public.profiles(xp desc);
create index profiles_streak_idx on public.profiles(current_streak desc);

-- ============================================================
-- CONTENT: WORLDS, UNITS, LESSONS, EXERCISES
-- ============================================================
-- Hierarchy: world > unit > lesson > exercise

create table public.worlds (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  title_en text not null,
  title_ka text not null,
  description_en text,
  description_ka text,
  emoji text,
  color text default '#58CC02',
  display_order int not null default 0,
  is_premium boolean default false,
  is_published boolean default false,
  created_at timestamptz default now()
);

create table public.units (
  id uuid primary key default uuid_generate_v4(),
  world_id uuid references public.worlds(id) on delete cascade,
  slug text not null,
  title_en text not null,
  title_ka text not null,
  description_en text,
  description_ka text,
  emoji text,
  display_order int not null default 0,
  is_premium boolean default false,
  is_published boolean default false,
  created_at timestamptz default now(),
  unique(world_id, slug)
);

create index units_world_idx on public.units(world_id, display_order);

create table public.lessons (
  id uuid primary key default uuid_generate_v4(),
  unit_id uuid references public.units(id) on delete cascade,
  slug text not null,
  title_en text not null,
  title_ka text not null,
  emoji text,
  display_order int not null default 0,
  xp_reward int default 10,
  is_published boolean default false,
  created_at timestamptz default now(),
  unique(unit_id, slug)
);

create index lessons_unit_idx on public.lessons(unit_id, display_order);

-- Exercises: the actual content. Type-discriminated JSON for flexibility.
create table public.exercises (
  id uuid primary key default uuid_generate_v4(),
  lesson_id uuid references public.lessons(id) on delete cascade,
  display_order int not null default 0,
  exercise_type text not null check (exercise_type in (
    'learn',          -- Show new vocabulary card
    'match',          -- Multiple choice translation
    'listen',         -- Hear and pick the right word
    'speak',          -- Speak the target phrase
    'build',          -- Drag words to form sentence
    'translate',      -- Translate sentence (typed)
    'story',          -- Mini-story with comprehension
    'roleplay'        -- AI conversation roleplay
  )),
  data jsonb not null,
  -- Example data structures by type:
  -- learn:    {emoji, en, ka, audio_url, sound}
  -- match:    {prompt_en, prompt_ka, correct, choices: [{en, ka, emoji}]}
  -- listen:   {audio_url, prompt_en, prompt_ka, correct, choices: [...]}
  -- speak:    {target, ka, prompt_en, prompt_ka, audio_url}
  -- build:    {target: [...], bank: [...], prompt_en, prompt_ka, ka}
  -- translate:{source_en, target_ka, accept: [...]}
  -- story:    {scenes: [{image, en, ka}], questions: [...]}
  -- roleplay: {scenario_en, scenario_ka, system_prompt, target_phrases: [...]}
  created_at timestamptz default now()
);

create index exercises_lesson_idx on public.exercises(lesson_id, display_order);

-- ============================================================
-- USER PROGRESS
-- ============================================================
create table public.lesson_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  status text default 'in_progress' check (status in ('in_progress', 'completed', 'mastered')),
  best_score int default 0 check (best_score between 0 and 100),
  attempts int default 0,
  total_time_seconds int default 0,
  first_completed_at timestamptz,
  last_attempted_at timestamptz default now(),
  unique(user_id, lesson_id)
);

create index lesson_progress_user_idx on public.lesson_progress(user_id);

create table public.exercise_attempts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  exercise_id uuid references public.exercises(id) on delete cascade,
  is_correct boolean not null,
  user_answer jsonb,
  time_taken_ms int,
  created_at timestamptz default now()
);

create index exercise_attempts_user_idx on public.exercise_attempts(user_id, created_at desc);
create index exercise_attempts_exercise_idx on public.exercise_attempts(exercise_id);

-- ============================================================
-- GAMIFICATION: STREAKS, LEAGUES, ACHIEVEMENTS
-- ============================================================
create table public.daily_xp (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  date date not null,
  xp_earned int default 0,
  lessons_completed int default 0,
  unique(user_id, date)
);

create index daily_xp_user_date_idx on public.daily_xp(user_id, date desc);

create table public.leagues (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  tier int not null,
  emoji text,
  start_date date not null,
  end_date date not null
);

create table public.league_participants (
  id uuid primary key default uuid_generate_v4(),
  league_id uuid references public.leagues(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  weekly_xp int default 0,
  rank int,
  unique(league_id, user_id)
);

create index league_participants_xp_idx on public.league_participants(league_id, weekly_xp desc);

create table public.achievements (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  title_en text not null,
  title_ka text not null,
  description_en text,
  description_ka text,
  emoji text,
  xp_reward int default 50,
  gem_reward int default 0
);

create table public.user_achievements (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  achievement_id uuid references public.achievements(id) on delete cascade,
  earned_at timestamptz default now(),
  unique(user_id, achievement_id)
);

-- ============================================================
-- SUBSCRIPTIONS (Stripe)
-- ============================================================
create table public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade unique,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  tier text default 'free' check (tier in ('free', 'premium', 'family')),
  status text default 'active' check (status in ('active', 'trialing', 'past_due', 'canceled', 'incomplete')),
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  trial_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index subscriptions_status_idx on public.subscriptions(status);
create index subscriptions_stripe_customer_idx on public.subscriptions(stripe_customer_id);

-- Family seats: one premium-family subscription supports up to 4 child profiles
create table public.family_seats (
  id uuid primary key default uuid_generate_v4(),
  subscription_id uuid references public.subscriptions(id) on delete cascade,
  child_profile_id uuid references public.profiles(id) on delete cascade,
  added_at timestamptz default now(),
  unique(subscription_id, child_profile_id)
);

-- ============================================================
-- AI TUTOR CONVERSATIONS
-- ============================================================
create table public.ai_conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  exercise_id uuid references public.exercises(id) on delete set null,
  scenario text,
  messages jsonb default '[]'::jsonb,
  evaluation jsonb,
  created_at timestamptz default now(),
  ended_at timestamptz
);

create index ai_conversations_user_idx on public.ai_conversations(user_id, created_at desc);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.exercise_attempts enable row level security;
alter table public.daily_xp enable row level security;
alter table public.subscriptions enable row level security;
alter table public.user_achievements enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.family_seats enable row level security;
alter table public.league_participants enable row level security;

-- Profiles: users see/edit only their own
create policy "Users view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Progress tables: users see/edit only their own
create policy "Users view own progress" on public.lesson_progress for select using (auth.uid() = user_id);
create policy "Users insert own progress" on public.lesson_progress for insert with check (auth.uid() = user_id);
create policy "Users update own progress" on public.lesson_progress for update using (auth.uid() = user_id);

create policy "Users view own attempts" on public.exercise_attempts for select using (auth.uid() = user_id);
create policy "Users insert own attempts" on public.exercise_attempts for insert with check (auth.uid() = user_id);

create policy "Users view own daily xp" on public.daily_xp for select using (auth.uid() = user_id);
create policy "Users upsert own daily xp" on public.daily_xp for all using (auth.uid() = user_id);

create policy "Users view own subscription" on public.subscriptions for select using (auth.uid() = user_id);
create policy "Users view own achievements" on public.user_achievements for select using (auth.uid() = user_id);
create policy "Users view own conversations" on public.ai_conversations for all using (auth.uid() = user_id);
create policy "Users view own family seats" on public.family_seats for select using (
  auth.uid() in (select user_id from public.subscriptions where id = subscription_id)
  or auth.uid() = child_profile_id
);

-- League participants: anyone authenticated can read leaderboards
create policy "Anyone authenticated reads leagues" on public.league_participants for select using (auth.role() = 'authenticated');

-- Content tables (worlds, units, lessons, exercises): public read of published content
alter table public.worlds enable row level security;
alter table public.units enable row level security;
alter table public.lessons enable row level security;
alter table public.exercises enable row level security;

create policy "Anyone reads published worlds" on public.worlds for select using (is_published = true);
create policy "Anyone reads published units" on public.units for select using (is_published = true);
create policy "Anyone reads published lessons" on public.lessons for select using (is_published = true);
create policy "Anyone reads exercises of published lessons" on public.exercises for select using (
  exists (select 1 from public.lessons l where l.id = lesson_id and l.is_published = true)
);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  insert into public.subscriptions (user_id, tier, status) values (new.id, 'free', 'active');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update updated_at
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger subscriptions_touch before update on public.subscriptions
  for each row execute function public.touch_updated_at();

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Award XP and update streak in one atomic operation
create or replace function public.award_xp(p_user_id uuid, p_xp int)
returns void language plpgsql security definer as $$
declare
  today date := current_date;
  last_date date;
begin
  select last_active_date into last_date from public.profiles where id = p_user_id;

  -- Update streak
  if last_date is null or last_date < today - interval '1 day' then
    update public.profiles set current_streak = 1, last_active_date = today, xp = xp + p_xp where id = p_user_id;
  elsif last_date = today - interval '1 day' then
    update public.profiles set
      current_streak = current_streak + 1,
      longest_streak = greatest(longest_streak, current_streak + 1),
      last_active_date = today,
      xp = xp + p_xp
    where id = p_user_id;
  else
    update public.profiles set xp = xp + p_xp, last_active_date = today where id = p_user_id;
  end if;

  -- Daily XP tracking
  insert into public.daily_xp (user_id, date, xp_earned, lessons_completed)
  values (p_user_id, today, p_xp, 1)
  on conflict (user_id, date) do update set
    xp_earned = public.daily_xp.xp_earned + p_xp,
    lessons_completed = public.daily_xp.lessons_completed + 1;
end;
$$;
