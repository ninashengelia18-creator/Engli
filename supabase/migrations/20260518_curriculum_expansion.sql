-- ============================================================
-- ENGLI CURRICULUM EXPANSION — 2026-05-18
-- Run AFTER 20260428_more_lessons.sql.
--
-- Adds three new units of Beginner-level content (food, body, school)
-- plus an entry-level Intermediate world with one published unit so
-- learners who finish Beginner have a clear "what's next".
--
-- All inserts are idempotent — re-running won't duplicate rows.
-- ============================================================

-- ------------------------------------------------------------
-- BEGINNER → new units
-- ------------------------------------------------------------
with w as (select id from public.worlds where slug = 'beginner')
insert into public.units (world_id, slug, title_en, title_ka, emoji, display_order, is_premium, is_published)
select w.id, slug, title_en, title_ka, emoji, ord, premium, true from w, (values
  ('food-and-drink', 'Food & Drink', 'საჭმელი და სასმელი', '🍎', 6, false),
  ('my-body',        'My Body',      'ჩემი სხეული',          '👤', 7, false),
  ('school',         'At School',    'სკოლაში',              '🏫', 8, true)
) as v(slug, title_en, title_ka, emoji, ord, premium)
on conflict (world_id, slug) do nothing;

-- ------------------------------------------------------------
-- FOOD & DRINK — 3 lessons
-- ------------------------------------------------------------
with u as (select id from public.units where slug = 'food-and-drink')
insert into public.lessons (unit_id, slug, title_en, title_ka, emoji, display_order, xp_reward, is_published)
select u.id, slug, title_en, title_ka, emoji, ord, 10, true from u, (values
  ('fruits',     'Fruits',     'ხილი',     '🍎', 1),
  ('drinks',     'Drinks',     'სასმელი',   '🥛', 2),
  ('meals',      'Meals',      'კერძები',   '🍽️', 3)
) as v(slug, title_en, title_ka, emoji, ord)
on conflict (unit_id, slug) do nothing;

with l as (select id from public.lessons where slug = 'fruits')
insert into public.exercises (lesson_id, display_order, exercise_type, data)
select l.id, ord, etype, data from l, (values
  (1, 'learn', '{"emoji":"🍎","en":"Apple","ka":"ვაშლი","sound":"Apple"}'::jsonb),
  (2, 'learn', '{"emoji":"🍌","en":"Banana","ka":"ბანანი","sound":"Banana"}'::jsonb),
  (3, 'learn', '{"emoji":"🍇","en":"Grapes","ka":"ყურძენი","sound":"Grapes"}'::jsonb),
  (4, 'learn', '{"emoji":"🍊","en":"Orange","ka":"ფორთოხალი","sound":"Orange"}'::jsonb),
  (5, 'match', '{"prompt_en":"Which is an apple?","prompt_ka":"რომელია ვაშლი?","correct":"Apple","choices":[{"en":"Apple","ka":"ვაშლი","emoji":"🍎"},{"en":"Banana","ka":"ბანანი","emoji":"🍌"},{"en":"Orange","ka":"ფორთოხალი","emoji":"🍊"},{"en":"Grapes","ka":"ყურძენი","emoji":"🍇"}]}'::jsonb),
  (6, 'speak', '{"target":"Apple","ka":"ვაშლი","prompt_en":"Say: Apple","prompt_ka":"თქვი: Apple"}'::jsonb),
  (7, 'build', '{"target":["I","like","apples"],"bank":["I","like","apples","bananas","you","is"],"prompt_en":"Build: I like apples","prompt_ka":"ააგე: მე მიყვარს ვაშლი","ka":"მე მიყვარს ვაშლი"}'::jsonb),
  (8, 'translate', '{"source_en":"I eat a banana","target_ka":"მე ვჭამ ბანანს","accept":["მე ვჭამ ბანანს"]}'::jsonb)
) as v(ord, etype, data)
where not exists (select 1 from public.exercises e where e.lesson_id = l.id);

with l as (select id from public.lessons where slug = 'drinks')
insert into public.exercises (lesson_id, display_order, exercise_type, data)
select l.id, ord, etype, data from l, (values
  (1, 'learn', '{"emoji":"💧","en":"Water","ka":"წყალი","sound":"Water"}'::jsonb),
  (2, 'learn', '{"emoji":"🥛","en":"Milk","ka":"რძე","sound":"Milk"}'::jsonb),
  (3, 'learn', '{"emoji":"🧃","en":"Juice","ka":"წვენი","sound":"Juice"}'::jsonb),
  (4, 'learn', '{"emoji":"🍵","en":"Tea","ka":"ჩაი","sound":"Tea"}'::jsonb),
  (5, 'match', '{"prompt_en":"Which is water?","prompt_ka":"რომელია წყალი?","correct":"Water","choices":[{"en":"Water","ka":"წყალი","emoji":"💧"},{"en":"Milk","ka":"რძე","emoji":"🥛"},{"en":"Juice","ka":"წვენი","emoji":"🧃"},{"en":"Tea","ka":"ჩაი","emoji":"🍵"}]}'::jsonb),
  (6, 'speak', '{"target":"Water","ka":"წყალი","prompt_en":"Say: Water","prompt_ka":"თქვი: Water"}'::jsonb),
  (7, 'build', '{"target":["I","want","water"],"bank":["I","want","water","milk","juice","you"],"prompt_en":"Build: I want water","prompt_ka":"ააგე: მე წყალი მინდა","ka":"მე წყალი მინდა"}'::jsonb)
) as v(ord, etype, data)
where not exists (select 1 from public.exercises e where e.lesson_id = l.id);

with l as (select id from public.lessons where slug = 'meals')
insert into public.exercises (lesson_id, display_order, exercise_type, data)
select l.id, ord, etype, data from l, (values
  (1, 'learn', '{"emoji":"🍞","en":"Bread","ka":"პური","sound":"Bread"}'::jsonb),
  (2, 'learn', '{"emoji":"🍚","en":"Rice","ka":"ბრინჯი","sound":"Rice"}'::jsonb),
  (3, 'learn', '{"emoji":"🍳","en":"Egg","ka":"კვერცხი","sound":"Egg"}'::jsonb),
  (4, 'learn', '{"emoji":"🧀","en":"Cheese","ka":"ყველი","sound":"Cheese"}'::jsonb),
  (5, 'match', '{"prompt_en":"Which is bread?","prompt_ka":"რომელია პური?","correct":"Bread","choices":[{"en":"Bread","ka":"პური","emoji":"🍞"},{"en":"Rice","ka":"ბრინჯი","emoji":"🍚"},{"en":"Egg","ka":"კვერცხი","emoji":"🍳"},{"en":"Cheese","ka":"ყველი","emoji":"🧀"}]}'::jsonb),
  (6, 'speak', '{"target":"Bread","ka":"პური","prompt_en":"Say: Bread","prompt_ka":"თქვი: Bread"}'::jsonb),
  (7, 'translate', '{"source_en":"I eat bread and cheese","target_ka":"მე ვჭამ პურს და ყველს","accept":["მე ვჭამ პურს და ყველს"]}'::jsonb)
) as v(ord, etype, data)
where not exists (select 1 from public.exercises e where e.lesson_id = l.id);

-- ------------------------------------------------------------
-- MY BODY — 2 lessons
-- ------------------------------------------------------------
with u as (select id from public.units where slug = 'my-body')
insert into public.lessons (unit_id, slug, title_en, title_ka, emoji, display_order, xp_reward, is_published)
select u.id, slug, title_en, title_ka, emoji, ord, 10, true from u, (values
  ('face',         'My Face',         'სახე',         '😀', 1),
  ('hands-feet',   'Hands and Feet',  'ხელები და ფეხები', '✋', 2)
) as v(slug, title_en, title_ka, emoji, ord)
on conflict (unit_id, slug) do nothing;

with l as (select id from public.lessons where slug = 'face')
insert into public.exercises (lesson_id, display_order, exercise_type, data)
select l.id, ord, etype, data from l, (values
  (1, 'learn', '{"emoji":"👁️","en":"Eye","ka":"თვალი","sound":"Eye"}'::jsonb),
  (2, 'learn', '{"emoji":"👃","en":"Nose","ka":"ცხვირი","sound":"Nose"}'::jsonb),
  (3, 'learn', '{"emoji":"👄","en":"Mouth","ka":"პირი","sound":"Mouth"}'::jsonb),
  (4, 'learn', '{"emoji":"👂","en":"Ear","ka":"ყური","sound":"Ear"}'::jsonb),
  (5, 'match', '{"prompt_en":"Which is the nose?","prompt_ka":"რომელია ცხვირი?","correct":"Nose","choices":[{"en":"Nose","ka":"ცხვირი","emoji":"👃"},{"en":"Eye","ka":"თვალი","emoji":"👁️"},{"en":"Mouth","ka":"პირი","emoji":"👄"},{"en":"Ear","ka":"ყური","emoji":"👂"}]}'::jsonb),
  (6, 'speak', '{"target":"Eye","ka":"თვალი","prompt_en":"Say: Eye","prompt_ka":"თქვი: Eye"}'::jsonb),
  (7, 'build', '{"target":["I","have","two","eyes"],"bank":["I","have","two","eyes","you","one"],"prompt_en":"Build: I have two eyes","prompt_ka":"ააგე: მე ორი თვალი მაქვს","ka":"მე ორი თვალი მაქვს"}'::jsonb)
) as v(ord, etype, data)
where not exists (select 1 from public.exercises e where e.lesson_id = l.id);

with l as (select id from public.lessons where slug = 'hands-feet')
insert into public.exercises (lesson_id, display_order, exercise_type, data)
select l.id, ord, etype, data from l, (values
  (1, 'learn', '{"emoji":"✋","en":"Hand","ka":"ხელი","sound":"Hand"}'::jsonb),
  (2, 'learn', '{"emoji":"🦶","en":"Foot","ka":"ფეხი","sound":"Foot"}'::jsonb),
  (3, 'learn', '{"emoji":"💪","en":"Arm","ka":"მკლავი","sound":"Arm"}'::jsonb),
  (4, 'learn', '{"emoji":"🦵","en":"Leg","ka":"ფეხი","sound":"Leg"}'::jsonb),
  (5, 'match', '{"prompt_en":"Which means hand?","prompt_ka":"რა ნიშნავს ხელი?","correct":"Hand","choices":[{"en":"Hand","ka":"ხელი","emoji":"✋"},{"en":"Foot","ka":"ფეხი","emoji":"🦶"},{"en":"Arm","ka":"მკლავი","emoji":"💪"},{"en":"Leg","ka":"ფეხი","emoji":"🦵"}]}'::jsonb),
  (6, 'speak', '{"target":"Hand","ka":"ხელი","prompt_en":"Say: Hand","prompt_ka":"თქვი: Hand"}'::jsonb),
  (7, 'translate', '{"source_en":"My hand is small","target_ka":"ჩემი ხელი პატარაა","accept":["ჩემი ხელი პატარაა"]}'::jsonb)
) as v(ord, etype, data)
where not exists (select 1 from public.exercises e where e.lesson_id = l.id);

-- ------------------------------------------------------------
-- AT SCHOOL — 2 lessons (premium unit)
-- ------------------------------------------------------------
with u as (select id from public.units where slug = 'school')
insert into public.lessons (unit_id, slug, title_en, title_ka, emoji, display_order, xp_reward, is_published)
select u.id, slug, title_en, title_ka, emoji, ord, 10, true from u, (values
  ('classroom',  'In the Classroom', 'საკლასო ოთახში', '📚', 1),
  ('subjects',   'School Subjects',  'სასკოლო საგნები', '📐', 2)
) as v(slug, title_en, title_ka, emoji, ord)
on conflict (unit_id, slug) do nothing;

with l as (select id from public.lessons where slug = 'classroom')
insert into public.exercises (lesson_id, display_order, exercise_type, data)
select l.id, ord, etype, data from l, (values
  (1, 'learn', '{"emoji":"📖","en":"Book","ka":"წიგნი","sound":"Book"}'::jsonb),
  (2, 'learn', '{"emoji":"✏️","en":"Pencil","ka":"ფანქარი","sound":"Pencil"}'::jsonb),
  (3, 'learn', '{"emoji":"🎒","en":"Bag","ka":"ჩანთა","sound":"Bag"}'::jsonb),
  (4, 'learn', '{"emoji":"🪑","en":"Chair","ka":"სკამი","sound":"Chair"}'::jsonb),
  (5, 'match', '{"prompt_en":"Which is a book?","prompt_ka":"რომელია წიგნი?","correct":"Book","choices":[{"en":"Book","ka":"წიგნი","emoji":"📖"},{"en":"Pencil","ka":"ფანქარი","emoji":"✏️"},{"en":"Bag","ka":"ჩანთა","emoji":"🎒"},{"en":"Chair","ka":"სკამი","emoji":"🪑"}]}'::jsonb),
  (6, 'speak', '{"target":"Pencil","ka":"ფანქარი","prompt_en":"Say: Pencil","prompt_ka":"თქვი: Pencil"}'::jsonb),
  (7, 'build', '{"target":["I","have","a","book"],"bank":["I","have","a","book","pencil","is"],"prompt_en":"Build: I have a book","prompt_ka":"ააგე: მე მაქვს წიგნი","ka":"მე მაქვს წიგნი"}'::jsonb)
) as v(ord, etype, data)
where not exists (select 1 from public.exercises e where e.lesson_id = l.id);

with l as (select id from public.lessons where slug = 'subjects')
insert into public.exercises (lesson_id, display_order, exercise_type, data)
select l.id, ord, etype, data from l, (values
  (1, 'learn', '{"emoji":"🔢","en":"Math","ka":"მათემატიკა","sound":"Math"}'::jsonb),
  (2, 'learn', '{"emoji":"🔬","en":"Science","ka":"საბუნებისმეტყველო","sound":"Science"}'::jsonb),
  (3, 'learn', '{"emoji":"🎨","en":"Art","ka":"ხელოვნება","sound":"Art"}'::jsonb),
  (4, 'learn', '{"emoji":"⚽","en":"Sport","ka":"სპორტი","sound":"Sport"}'::jsonb),
  (5, 'match', '{"prompt_en":"Which means art?","prompt_ka":"რა ნიშნავს ხელოვნება?","correct":"Art","choices":[{"en":"Art","ka":"ხელოვნება","emoji":"🎨"},{"en":"Math","ka":"მათემატიკა","emoji":"🔢"},{"en":"Science","ka":"საბუნებისმეტყველო","emoji":"🔬"},{"en":"Sport","ka":"სპორტი","emoji":"⚽"}]}'::jsonb),
  (6, 'speak', '{"target":"Math","ka":"მათემატიკა","prompt_en":"Say: Math","prompt_ka":"თქვი: Math"}'::jsonb),
  (7, 'translate', '{"source_en":"I love science","target_ka":"მე მიყვარს საბუნებისმეტყველო","accept":["მე მიყვარს საბუნებისმეტყველო"]}'::jsonb)
) as v(ord, etype, data)
where not exists (select 1 from public.exercises e where e.lesson_id = l.id);

-- ------------------------------------------------------------
-- INTERMEDIATE world — entry-level "what's next" after Beginner
-- ------------------------------------------------------------
insert into public.worlds (slug, title_en, title_ka, description_en, description_ka, emoji, color, display_order, is_premium, is_published)
values (
  'intermediate',
  'Everyday English',
  'ყოველდღიური ინგლისური',
  'Short sentences for daily life',
  'მოკლე წინადადებები ყოველდღიური ცხოვრებისთვის',
  '🚀', '#1CB0F6', 2, true, true
)
on conflict (slug) do nothing;

with w as (select id from public.worlds where slug = 'intermediate')
insert into public.units (world_id, slug, title_en, title_ka, emoji, display_order, is_premium, is_published)
select w.id, slug, title_en, title_ka, emoji, ord, premium, true from w, (values
  ('around-home', 'Around the Home', 'სახლში', '🏠', 1, true),
  ('time-and-day', 'Time and Day',   'დრო და დღე', '⏰', 2, true)
) as v(slug, title_en, title_ka, emoji, ord, premium)
on conflict (world_id, slug) do nothing;

with u as (select id from public.units where slug = 'around-home')
insert into public.lessons (unit_id, slug, title_en, title_ka, emoji, display_order, xp_reward, is_published)
select u.id, slug, title_en, title_ka, emoji, ord, 15, true from u, (values
  ('rooms',     'Rooms in a House', 'ოთახები',     '🛋️', 1),
  ('chores',    'Things We Do',     'რასაც ვაკეთებთ', '🧹', 2)
) as v(slug, title_en, title_ka, emoji, ord)
on conflict (unit_id, slug) do nothing;

with l as (select id from public.lessons where slug = 'rooms')
insert into public.exercises (lesson_id, display_order, exercise_type, data)
select l.id, ord, etype, data from l, (values
  (1, 'learn', '{"emoji":"🛏️","en":"Bedroom","ka":"საძინებელი","sound":"Bedroom"}'::jsonb),
  (2, 'learn', '{"emoji":"🍳","en":"Kitchen","ka":"სამზარეულო","sound":"Kitchen"}'::jsonb),
  (3, 'learn', '{"emoji":"🛁","en":"Bathroom","ka":"აბაზანა","sound":"Bathroom"}'::jsonb),
  (4, 'learn', '{"emoji":"🛋️","en":"Living room","ka":"სასტუმრო","sound":"Living room"}'::jsonb),
  (5, 'match', '{"prompt_en":"Which is the kitchen?","prompt_ka":"რომელია სამზარეულო?","correct":"Kitchen","choices":[{"en":"Kitchen","ka":"სამზარეულო","emoji":"🍳"},{"en":"Bedroom","ka":"საძინებელი","emoji":"🛏️"},{"en":"Bathroom","ka":"აბაზანა","emoji":"🛁"},{"en":"Living room","ka":"სასტუმრო","emoji":"🛋️"}]}'::jsonb),
  (6, 'build', '{"target":["My","bedroom","is","big"],"bank":["My","bedroom","kitchen","is","big","small"],"prompt_en":"Build: My bedroom is big","prompt_ka":"ააგე: ჩემი საძინებელი დიდია","ka":"ჩემი საძინებელი დიდია"}'::jsonb),
  (7, 'translate', '{"source_en":"The kitchen is small","target_ka":"სამზარეულო პატარაა","accept":["სამზარეულო პატარაა"]}'::jsonb)
) as v(ord, etype, data)
where not exists (select 1 from public.exercises e where e.lesson_id = l.id);

with l as (select id from public.lessons where slug = 'chores')
insert into public.exercises (lesson_id, display_order, exercise_type, data)
select l.id, ord, etype, data from l, (values
  (1, 'learn', '{"emoji":"🧹","en":"Clean","ka":"გასუფთავება","sound":"Clean"}'::jsonb),
  (2, 'learn', '{"emoji":"🍽️","en":"Eat","ka":"ჭამა","sound":"Eat"}'::jsonb),
  (3, 'learn', '{"emoji":"😴","en":"Sleep","ka":"ძილი","sound":"Sleep"}'::jsonb),
  (4, 'learn', '{"emoji":"📖","en":"Read","ka":"კითხვა","sound":"Read"}'::jsonb),
  (5, 'match', '{"prompt_en":"Which means read?","prompt_ka":"რა ნიშნავს კითხვა?","correct":"Read","choices":[{"en":"Read","ka":"კითხვა","emoji":"📖"},{"en":"Sleep","ka":"ძილი","emoji":"😴"},{"en":"Eat","ka":"ჭამა","emoji":"🍽️"},{"en":"Clean","ka":"გასუფთავება","emoji":"🧹"}]}'::jsonb),
  (6, 'speak', '{"target":"I read books","ka":"მე წიგნებს ვკითხულობ","prompt_en":"Say: I read books","prompt_ka":"თქვი: I read books"}'::jsonb),
  (7, 'translate', '{"source_en":"I eat in the kitchen","target_ka":"მე ვჭამ სამზარეულოში","accept":["მე ვჭამ სამზარეულოში"]}'::jsonb)
) as v(ord, etype, data)
where not exists (select 1 from public.exercises e where e.lesson_id = l.id);
