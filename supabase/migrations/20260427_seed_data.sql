-- ============================================================
-- ENGLI SEED DATA
-- Run AFTER initial schema migration. Adds first world + sample content.
-- ============================================================

-- WORLD 1: BEGINNER BASICS
insert into public.worlds (slug, title_en, title_ka, description_en, description_ka, emoji, color, display_order, is_premium, is_published)
values ('beginner', 'Beginner Basics', 'დასაწყისი', 'Your first English words', 'შენი პირველი ინგლისური სიტყვები', '🌱', '#58CC02', 1, false, true);

-- UNITS in World 1
with w as (select id from public.worlds where slug = 'beginner')
insert into public.units (world_id, slug, title_en, title_ka, emoji, display_order, is_premium, is_published)
select w.id, slug, title_en, title_ka, emoji, ord, premium, true from w, (values
  ('greetings', 'Greetings', 'მისალმება', '👋', 1, false),
  ('family', 'Family', 'ოჯახი', '👨‍👩‍👧', 2, false),
  ('animals', 'Animals', 'ცხოველები', '🐶', 3, false),
  ('colors', 'Colors', 'ფერები', '🎨', 4, true),
  ('numbers', 'Numbers', 'რიცხვები', '🔢', 5, true)
) as v(slug, title_en, title_ka, emoji, ord, premium);

-- LESSONS in Greetings unit
with u as (select id from public.units where slug = 'greetings')
insert into public.lessons (unit_id, slug, title_en, title_ka, emoji, display_order, xp_reward, is_published)
select u.id, slug, title_en, title_ka, emoji, ord, 10, true from u, (values
  ('hello', 'Hello!', 'გამარჯობა!', '👋', 1),
  ('goodbye', 'Goodbye', 'ნახვამდის', '🤚', 2),
  ('how-are-you', 'How are you?', 'როგორ ხარ?', '🙂', 3)
) as v(slug, title_en, title_ka, emoji, ord);

-- EXERCISES in Hello! lesson
with l as (select id from public.lessons where slug = 'hello')
insert into public.exercises (lesson_id, display_order, exercise_type, data)
select l.id, ord, etype, data from l, (values
  (1, 'learn', '{"emoji":"👋","en":"Hello","ka":"გამარჯობა","sound":"Hello"}'::jsonb),
  (2, 'learn', '{"emoji":"🌅","en":"Good morning","ka":"დილა მშვიდობისა","sound":"Good morning"}'::jsonb),
  (3, 'match', '{"prompt_en":"Which means hello?","prompt_ka":"რა ნიშნავს გამარჯობას?","correct":"Hello","choices":[{"en":"Hello","ka":"გამარჯობა","emoji":"👋"},{"en":"Goodbye","ka":"ნახვამდის","emoji":"🤚"},{"en":"Good night","ka":"ღამე მშვიდობისა","emoji":"🌙"},{"en":"Good morning","ka":"დილა მშვიდობისა","emoji":"🌅"}]}'::jsonb),
  (4, 'speak', '{"target":"Hello","ka":"გამარჯობა","prompt_en":"Say: Hello","prompt_ka":"თქვი: Hello"}'::jsonb),
  (5, 'build', '{"target":["Good","morning"],"bank":["Good","morning","night","Hello"],"prompt_en":"Build: Good morning","prompt_ka":"ააგე: დილა მშვიდობისა","ka":"დილა მშვიდობისა"}'::jsonb)
) as v(ord, etype, data);

-- ACHIEVEMENTS
insert into public.achievements (slug, title_en, title_ka, description_en, description_ka, emoji, xp_reward, gem_reward) values
('first_lesson', 'First Steps', 'პირველი ნაბიჯები', 'Complete your first lesson', 'დაასრულე პირველი გაკვეთილი', '🌟', 20, 5),
('week_streak', '7-Day Streak', '7 დღიანი სერია', 'Practice 7 days in a row', 'ივარჯიშე 7 დღე ზედიზედ', '🔥', 100, 20),
('month_streak', '30-Day Streak', '30 დღიანი სერია', 'Practice 30 days in a row', 'ივარჯიშე 30 დღე ზედიზედ', '🏆', 500, 100),
('hundred_words', 'Word Wizard', 'სიტყვების ოსტატი', 'Learn 100 words', 'ისწავლე 100 სიტყვა', '📚', 200, 50),
('perfect_lesson', 'Perfectionist', 'ფერფექციონისტი', 'Complete a lesson with no mistakes', 'დაასრულე გაკვეთილი შეცდომის გარეშე', '💎', 50, 10);
