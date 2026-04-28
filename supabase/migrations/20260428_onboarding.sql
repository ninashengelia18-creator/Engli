-- ============================================================
-- ONBOARDING — capture learning goal at signup
-- Run after 20260428_more_lessons.sql.
-- ============================================================

alter table public.profiles
  add column if not exists learning_goal text
  check (learning_goal in ('school', 'travel', 'play', 'future') or learning_goal is null);
