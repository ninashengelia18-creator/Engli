-- User-submitted issue / feedback reports.
--
-- Used by /api/feedback to capture bug reports, content issues, AI tutor
-- complaints, and general suggestions from the public contact page.
--
-- Idempotent: safe to re-run.

create table if not exists public.feedback_reports (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  category    text not null check (category in ('bug', 'content', 'ai', 'safety', 'other')),
  message     text not null check (char_length(message) between 1 and 4000),
  contact     text check (contact is null or char_length(contact) <= 200),
  page        text check (page is null or char_length(page) <= 500),
  user_agent  text check (user_agent is null or char_length(user_agent) <= 500),
  resolved    boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists feedback_reports_created_idx
  on public.feedback_reports (created_at desc);
create index if not exists feedback_reports_category_idx
  on public.feedback_reports (category, created_at desc);
create index if not exists feedback_reports_unresolved_idx
  on public.feedback_reports (resolved, created_at desc)
  where resolved = false;

alter table public.feedback_reports enable row level security;

-- Anyone (including anon) can insert via the API route, which uses the
-- service role and applies its own validation/rate-limiting. We leave no
-- direct insert policy for clients on purpose.

-- Owner can read their own submissions; admins read everything via
-- service role.
drop policy if exists "feedback read own" on public.feedback_reports;
create policy "feedback read own"
  on public.feedback_reports
  for select
  to authenticated
  using (user_id = auth.uid());
