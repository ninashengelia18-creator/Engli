-- ============================================================
-- ENGLI ADDITIONAL LESSONS — LAUNCH-DAY CONTENT
-- Run AFTER 20260427_seed_data.sql.
-- Fills in exercises for the two empty greetings lessons and
-- adds 10 new fully populated lessons across family, animals,
-- colors, and numbers — 13 playable lessons total.
-- ============================================================

-- ------------------------------------------------------------
-- GREETINGS unit — fill exercises for the two existing empty lessons
-- ------------------------------------------------------------

-- Goodbye lesson
with l as (select id from public.lessons where slug = 'goodbye')
insert into public.exercises (lesson_id, display_order, exercise_type, data)
select l.id, ord, etype, data from l, (values
  (1, 'learn', '{"emoji":"🤚","en":"Goodbye","ka":"ნახვამდის","sound":"Goodbye"}'::jsonb),
  (2, 'learn', '{"emoji":"🌙","en":"Good night","ka":"ღამე მშვიდობისა","sound":"Good night"}'::jsonb),
  (3, 'learn', '{"emoji":"🌆","en":"Good evening","ka":"საღამო მშვიდობისა","sound":"Good evening"}'::jsonb),
  (4, 'match', '{"prompt_en":"Which means good night?","prompt_ka":"რა ნიშნავს ღამე მშვიდობისა?","correct":"Good night","choices":[{"en":"Hello","ka":"გამარჯობა","emoji":"👋"},{"en":"Goodbye","ka":"ნახვამდის","emoji":"🤚"},{"en":"Good night","ka":"ღამე მშვიდობისა","emoji":"🌙"},{"en":"Good morning","ka":"დილა მშვიდობისა","emoji":"🌅"}]}'::jsonb),
  (5, 'speak', '{"target":"Goodbye","ka":"ნახვამდის","prompt_en":"Say: Goodbye","prompt_ka":"თქვი: Goodbye"}'::jsonb),
  (6, 'build', '{"target":["Good","night"],"bank":["Good","night","morning","Hello"],"prompt_en":"Build: Good night","prompt_ka":"ააგე: ღამე მშვიდობისა","ka":"ღამე მშვიდობისა"}'::jsonb)
) as v(ord, etype, data);

-- How are you? lesson
with l as (select id from public.lessons where slug = 'how-are-you')
insert into public.exercises (lesson_id, display_order, exercise_type, data)
select l.id, ord, etype, data from l, (values
  (1, 'learn', '{"emoji":"🙂","en":"How are you?","ka":"როგორ ხარ?","sound":"How are you"}'::jsonb),
  (2, 'learn', '{"emoji":"😊","en":"I am fine","ka":"კარგად ვარ","sound":"I am fine"}'::jsonb),
  (3, 'learn', '{"emoji":"🙏","en":"Thank you","ka":"გმადლობთ","sound":"Thank you"}'::jsonb),
  (4, 'match', '{"prompt_en":"Which means thank you?","prompt_ka":"რა ნიშნავს გმადლობთ?","correct":"Thank you","choices":[{"en":"Thank you","ka":"გმადლობთ","emoji":"🙏"},{"en":"Hello","ka":"გამარჯობა","emoji":"👋"},{"en":"How are you?","ka":"როგორ ხარ?","emoji":"🙂"},{"en":"I am fine","ka":"კარგად ვარ","emoji":"😊"}]}'::jsonb),
  (5, 'speak', '{"target":"I am fine","ka":"კარგად ვარ","prompt_en":"Say: I am fine","prompt_ka":"თქვი: I am fine"}'::jsonb),
  (6, 'build', '{"target":["How","are","you"],"bank":["How","are","you","I","am"],"prompt_en":"Build: How are you","prompt_ka":"ააგე: როგორ ხარ","ka":"როგორ ხარ"}'::jsonb)
) as v(ord, etype, data);

-- ------------------------------------------------------------
-- FAMILY unit — 3 lessons
-- ------------------------------------------------------------
with u as (select id from public.units where slug = 'family')
insert into public.lessons (unit_id, slug, title_en, title_ka, emoji, display_order, xp_reward, is_published)
select u.id, slug, title_en, title_ka, emoji, ord, 10, true from u, (values
  ('mom-and-dad', 'Mom and Dad', 'დედა და მამა', '👨‍👩‍👧', 1),
  ('brother-sister', 'Brother and Sister', 'და-ძმა', '👫', 2),
  ('grandparents', 'Grandparents', 'ბებია-ბაბუა', '👴', 3)
) as v(slug, title_en, title_ka, emoji, ord);

with l as (select id from public.lessons where slug = 'mom-and-dad')
insert into public.exercises (lesson_id, display_order, exercise_type, data)
select l.id, ord, etype, data from l, (values
  (1, 'learn', '{"emoji":"👩","en":"Mother","ka":"დედა","sound":"Mother"}'::jsonb),
  (2, 'learn', '{"emoji":"👨","en":"Father","ka":"მამა","sound":"Father"}'::jsonb),
  (3, 'match', '{"prompt_en":"Which means mother?","prompt_ka":"რა ნიშნავს დედა?","correct":"Mother","choices":[{"en":"Mother","ka":"დედა","emoji":"👩"},{"en":"Father","ka":"მამა","emoji":"👨"},{"en":"Brother","ka":"ძმა","emoji":"👦"},{"en":"Sister","ka":"და","emoji":"👧"}]}'::jsonb),
  (4, 'speak', '{"target":"Mother","ka":"დედა","prompt_en":"Say: Mother","prompt_ka":"თქვი: Mother"}'::jsonb),
  (5, 'build', '{"target":["My","mother"],"bank":["My","mother","father","is"],"prompt_en":"Build: My mother","prompt_ka":"ააგე: ჩემი დედა","ka":"ჩემი დედა"}'::jsonb)
) as v(ord, etype, data);

with l as (select id from public.lessons where slug = 'brother-sister')
insert into public.exercises (lesson_id, display_order, exercise_type, data)
select l.id, ord, etype, data from l, (values
  (1, 'learn', '{"emoji":"👦","en":"Brother","ka":"ძმა","sound":"Brother"}'::jsonb),
  (2, 'learn', '{"emoji":"👧","en":"Sister","ka":"და","sound":"Sister"}'::jsonb),
  (3, 'learn', '{"emoji":"👶","en":"Baby","ka":"ჩვილი","sound":"Baby"}'::jsonb),
  (4, 'match', '{"prompt_en":"Which means sister?","prompt_ka":"რა ნიშნავს და?","correct":"Sister","choices":[{"en":"Sister","ka":"და","emoji":"👧"},{"en":"Brother","ka":"ძმა","emoji":"👦"},{"en":"Mother","ka":"დედა","emoji":"👩"},{"en":"Baby","ka":"ჩვილი","emoji":"👶"}]}'::jsonb),
  (5, 'speak', '{"target":"Brother","ka":"ძმა","prompt_en":"Say: Brother","prompt_ka":"თქვი: Brother"}'::jsonb),
  (6, 'translate', '{"source_en":"My sister","target_ka":"ჩემი და","accept":["ჩემი და"]}'::jsonb)
) as v(ord, etype, data);

with l as (select id from public.lessons where slug = 'grandparents')
insert into public.exercises (lesson_id, display_order, exercise_type, data)
select l.id, ord, etype, data from l, (values
  (1, 'learn', '{"emoji":"👵","en":"Grandmother","ka":"ბებია","sound":"Grandmother"}'::jsonb),
  (2, 'learn', '{"emoji":"👴","en":"Grandfather","ka":"ბაბუა","sound":"Grandfather"}'::jsonb),
  (3, 'learn', '{"emoji":"👨‍👩‍👧","en":"Family","ka":"ოჯახი","sound":"Family"}'::jsonb),
  (4, 'match', '{"prompt_en":"Which means family?","prompt_ka":"რა ნიშნავს ოჯახი?","correct":"Family","choices":[{"en":"Family","ka":"ოჯახი","emoji":"👨‍👩‍👧"},{"en":"Grandfather","ka":"ბაბუა","emoji":"👴"},{"en":"Grandmother","ka":"ბებია","emoji":"👵"},{"en":"Brother","ka":"ძმა","emoji":"👦"}]}'::jsonb),
  (5, 'speak', '{"target":"Grandmother","ka":"ბებია","prompt_en":"Say: Grandmother","prompt_ka":"თქვი: Grandmother"}'::jsonb),
  (6, 'build', '{"target":["I","love","my","family"],"bank":["I","love","my","family","is","you"],"prompt_en":"Build: I love my family","prompt_ka":"ააგე: მე მიყვარს ჩემი ოჯახი","ka":"მე მიყვარს ჩემი ოჯახი"}'::jsonb)
) as v(ord, etype, data);

-- ------------------------------------------------------------
-- ANIMALS unit — 3 lessons
-- ------------------------------------------------------------
with u as (select id from public.units where slug = 'animals')
insert into public.lessons (unit_id, slug, title_en, title_ka, emoji, display_order, xp_reward, is_published)
select u.id, slug, title_en, title_ka, emoji, ord, 10, true from u, (values
  ('pets', 'Pets', 'შინაური ცხოველები', '🐶', 1),
  ('farm', 'On the Farm', 'ფერმაში', '🐄', 2),
  ('wild', 'Wild Animals', 'ველური ცხოველები', '🦁', 3)
) as v(slug, title_en, title_ka, emoji, ord);

with l as (select id from public.lessons where slug = 'pets')
insert into public.exercises (lesson_id, display_order, exercise_type, data)
select l.id, ord, etype, data from l, (values
  (1, 'learn', '{"emoji":"🐶","en":"Dog","ka":"ძაღლი","sound":"Dog"}'::jsonb),
  (2, 'learn', '{"emoji":"🐱","en":"Cat","ka":"კატა","sound":"Cat"}'::jsonb),
  (3, 'learn', '{"emoji":"🐦","en":"Bird","ka":"ფრინველი","sound":"Bird"}'::jsonb),
  (4, 'learn', '{"emoji":"🐟","en":"Fish","ka":"თევზი","sound":"Fish"}'::jsonb),
  (5, 'match', '{"prompt_en":"Which is a cat?","prompt_ka":"რომელია კატა?","correct":"Cat","choices":[{"en":"Cat","ka":"კატა","emoji":"🐱"},{"en":"Dog","ka":"ძაღლი","emoji":"🐶"},{"en":"Bird","ka":"ფრინველი","emoji":"🐦"},{"en":"Fish","ka":"თევზი","emoji":"🐟"}]}'::jsonb),
  (6, 'speak', '{"target":"Dog","ka":"ძაღლი","prompt_en":"Say: Dog","prompt_ka":"თქვი: Dog"}'::jsonb),
  (7, 'build', '{"target":["The","cat","is","big"],"bank":["The","cat","dog","is","big","small"],"prompt_en":"Build: The cat is big","prompt_ka":"ააგე: კატა დიდია","ka":"კატა დიდია"}'::jsonb)
) as v(ord, etype, data);

with l as (select id from public.lessons where slug = 'farm')
insert into public.exercises (lesson_id, display_order, exercise_type, data)
select l.id, ord, etype, data from l, (values
  (1, 'learn', '{"emoji":"🐄","en":"Cow","ka":"ძროხა","sound":"Cow"}'::jsonb),
  (2, 'learn', '{"emoji":"🐎","en":"Horse","ka":"ცხენი","sound":"Horse"}'::jsonb),
  (3, 'learn', '{"emoji":"🐔","en":"Chicken","ka":"ქათამი","sound":"Chicken"}'::jsonb),
  (4, 'learn', '{"emoji":"🐑","en":"Sheep","ka":"ცხვარი","sound":"Sheep"}'::jsonb),
  (5, 'match', '{"prompt_en":"Which is a horse?","prompt_ka":"რომელია ცხენი?","correct":"Horse","choices":[{"en":"Horse","ka":"ცხენი","emoji":"🐎"},{"en":"Cow","ka":"ძროხა","emoji":"🐄"},{"en":"Sheep","ka":"ცხვარი","emoji":"🐑"},{"en":"Chicken","ka":"ქათამი","emoji":"🐔"}]}'::jsonb),
  (6, 'speak', '{"target":"Horse","ka":"ცხენი","prompt_en":"Say: Horse","prompt_ka":"თქვი: Horse"}'::jsonb),
  (7, 'translate', '{"source_en":"The cow is big","target_ka":"ძროხა დიდია","accept":["ძროხა დიდია"]}'::jsonb)
) as v(ord, etype, data);

with l as (select id from public.lessons where slug = 'wild')
insert into public.exercises (lesson_id, display_order, exercise_type, data)
select l.id, ord, etype, data from l, (values
  (1, 'learn', '{"emoji":"🦁","en":"Lion","ka":"ლომი","sound":"Lion"}'::jsonb),
  (2, 'learn', '{"emoji":"🐯","en":"Tiger","ka":"ვეფხვი","sound":"Tiger"}'::jsonb),
  (3, 'learn', '{"emoji":"🐘","en":"Elephant","ka":"სპილო","sound":"Elephant"}'::jsonb),
  (4, 'learn', '{"emoji":"🐻","en":"Bear","ka":"დათვი","sound":"Bear"}'::jsonb),
  (5, 'learn', '{"emoji":"🐒","en":"Monkey","ka":"მაიმუნი","sound":"Monkey"}'::jsonb),
  (6, 'match', '{"prompt_en":"Which is an elephant?","prompt_ka":"რომელია სპილო?","correct":"Elephant","choices":[{"en":"Elephant","ka":"სპილო","emoji":"🐘"},{"en":"Lion","ka":"ლომი","emoji":"🦁"},{"en":"Bear","ka":"დათვი","emoji":"🐻"},{"en":"Tiger","ka":"ვეფხვი","emoji":"🐯"}]}'::jsonb),
  (7, 'speak', '{"target":"Lion","ka":"ლომი","prompt_en":"Say: Lion","prompt_ka":"თქვი: Lion"}'::jsonb),
  (8, 'build', '{"target":["The","lion","is","big"],"bank":["The","lion","tiger","is","big","small"],"prompt_en":"Build: The lion is big","prompt_ka":"ააგე: ლომი დიდია","ka":"ლომი დიდია"}'::jsonb)
) as v(ord, etype, data);

-- ------------------------------------------------------------
-- COLORS unit (premium) — 2 lessons
-- ------------------------------------------------------------
with u as (select id from public.units where slug = 'colors')
insert into public.lessons (unit_id, slug, title_en, title_ka, emoji, display_order, xp_reward, is_published)
select u.id, slug, title_en, title_ka, emoji, ord, 10, true from u, (values
  ('basic-colors', 'Basic Colors', 'ძირითადი ფერები', '🎨', 1),
  ('more-colors', 'More Colors', 'მეტი ფერები', '🌈', 2)
) as v(slug, title_en, title_ka, emoji, ord);

with l as (select id from public.lessons where slug = 'basic-colors')
insert into public.exercises (lesson_id, display_order, exercise_type, data)
select l.id, ord, etype, data from l, (values
  (1, 'learn', '{"emoji":"🟥","en":"Red","ka":"წითელი","sound":"Red"}'::jsonb),
  (2, 'learn', '{"emoji":"🟦","en":"Blue","ka":"ლურჯი","sound":"Blue"}'::jsonb),
  (3, 'learn', '{"emoji":"🟩","en":"Green","ka":"მწვანე","sound":"Green"}'::jsonb),
  (4, 'learn', '{"emoji":"🟨","en":"Yellow","ka":"ყვითელი","sound":"Yellow"}'::jsonb),
  (5, 'match', '{"prompt_en":"Which means red?","prompt_ka":"რა ნიშნავს წითელი?","correct":"Red","choices":[{"en":"Red","ka":"წითელი","emoji":"🟥"},{"en":"Blue","ka":"ლურჯი","emoji":"🟦"},{"en":"Green","ka":"მწვანე","emoji":"🟩"},{"en":"Yellow","ka":"ყვითელი","emoji":"🟨"}]}'::jsonb),
  (6, 'speak', '{"target":"Blue","ka":"ლურჯი","prompt_en":"Say: Blue","prompt_ka":"თქვი: Blue"}'::jsonb),
  (7, 'build', '{"target":["The","sky","is","blue"],"bank":["The","sky","is","blue","red","green"],"prompt_en":"Build: The sky is blue","prompt_ka":"ააგე: ცა ლურჯია","ka":"ცა ლურჯია"}'::jsonb)
) as v(ord, etype, data);

with l as (select id from public.lessons where slug = 'more-colors')
insert into public.exercises (lesson_id, display_order, exercise_type, data)
select l.id, ord, etype, data from l, (values
  (1, 'learn', '{"emoji":"⬛","en":"Black","ka":"შავი","sound":"Black"}'::jsonb),
  (2, 'learn', '{"emoji":"⬜","en":"White","ka":"თეთრი","sound":"White"}'::jsonb),
  (3, 'learn', '{"emoji":"🟧","en":"Orange","ka":"ნარინჯისფერი","sound":"Orange"}'::jsonb),
  (4, 'learn', '{"emoji":"🟪","en":"Purple","ka":"იასამნისფერი","sound":"Purple"}'::jsonb),
  (5, 'learn', '{"emoji":"🟫","en":"Brown","ka":"ყავისფერი","sound":"Brown"}'::jsonb),
  (6, 'match', '{"prompt_en":"Which means white?","prompt_ka":"რა ნიშნავს თეთრი?","correct":"White","choices":[{"en":"White","ka":"თეთრი","emoji":"⬜"},{"en":"Black","ka":"შავი","emoji":"⬛"},{"en":"Orange","ka":"ნარინჯისფერი","emoji":"🟧"},{"en":"Purple","ka":"იასამნისფერი","emoji":"🟪"}]}'::jsonb),
  (7, 'speak', '{"target":"Black","ka":"შავი","prompt_en":"Say: Black","prompt_ka":"თქვი: Black"}'::jsonb),
  (8, 'translate', '{"source_en":"The cat is black","target_ka":"კატა შავია","accept":["კატა შავია"]}'::jsonb)
) as v(ord, etype, data);

-- ------------------------------------------------------------
-- NUMBERS unit (premium) — 2 lessons
-- ------------------------------------------------------------
with u as (select id from public.units where slug = 'numbers')
insert into public.lessons (unit_id, slug, title_en, title_ka, emoji, display_order, xp_reward, is_published)
select u.id, slug, title_en, title_ka, emoji, ord, 10, true from u, (values
  ('one-to-five', '1 to 5', '1-დან 5-მდე', '5️⃣', 1),
  ('six-to-ten', '6 to 10', '6-დან 10-მდე', '🔟', 2)
) as v(slug, title_en, title_ka, emoji, ord);

with l as (select id from public.lessons where slug = 'one-to-five')
insert into public.exercises (lesson_id, display_order, exercise_type, data)
select l.id, ord, etype, data from l, (values
  (1, 'learn', '{"emoji":"1️⃣","en":"One","ka":"ერთი","sound":"One"}'::jsonb),
  (2, 'learn', '{"emoji":"2️⃣","en":"Two","ka":"ორი","sound":"Two"}'::jsonb),
  (3, 'learn', '{"emoji":"3️⃣","en":"Three","ka":"სამი","sound":"Three"}'::jsonb),
  (4, 'learn', '{"emoji":"4️⃣","en":"Four","ka":"ოთხი","sound":"Four"}'::jsonb),
  (5, 'learn', '{"emoji":"5️⃣","en":"Five","ka":"ხუთი","sound":"Five"}'::jsonb),
  (6, 'match', '{"prompt_en":"Which means three?","prompt_ka":"რა ნიშნავს სამი?","correct":"Three","choices":[{"en":"Three","ka":"სამი","emoji":"3️⃣"},{"en":"One","ka":"ერთი","emoji":"1️⃣"},{"en":"Five","ka":"ხუთი","emoji":"5️⃣"},{"en":"Two","ka":"ორი","emoji":"2️⃣"}]}'::jsonb),
  (7, 'speak', '{"target":"Five","ka":"ხუთი","prompt_en":"Say: Five","prompt_ka":"თქვი: Five"}'::jsonb),
  (8, 'build', '{"target":["I","am","five"],"bank":["I","am","five","four","you","is"],"prompt_en":"Build: I am five","prompt_ka":"ააგე: მე ვარ ხუთი","ka":"მე ვარ ხუთი"}'::jsonb)
) as v(ord, etype, data);

with l as (select id from public.lessons where slug = 'six-to-ten')
insert into public.exercises (lesson_id, display_order, exercise_type, data)
select l.id, ord, etype, data from l, (values
  (1, 'learn', '{"emoji":"6️⃣","en":"Six","ka":"ექვსი","sound":"Six"}'::jsonb),
  (2, 'learn', '{"emoji":"7️⃣","en":"Seven","ka":"შვიდი","sound":"Seven"}'::jsonb),
  (3, 'learn', '{"emoji":"8️⃣","en":"Eight","ka":"რვა","sound":"Eight"}'::jsonb),
  (4, 'learn', '{"emoji":"9️⃣","en":"Nine","ka":"ცხრა","sound":"Nine"}'::jsonb),
  (5, 'learn', '{"emoji":"🔟","en":"Ten","ka":"ათი","sound":"Ten"}'::jsonb),
  (6, 'match', '{"prompt_en":"Which means ten?","prompt_ka":"რა ნიშნავს ათი?","correct":"Ten","choices":[{"en":"Ten","ka":"ათი","emoji":"🔟"},{"en":"Eight","ka":"რვა","emoji":"8️⃣"},{"en":"Six","ka":"ექვსი","emoji":"6️⃣"},{"en":"Nine","ka":"ცხრა","emoji":"9️⃣"}]}'::jsonb),
  (7, 'speak', '{"target":"Ten","ka":"ათი","prompt_en":"Say: Ten","prompt_ka":"თქვი: Ten"}'::jsonb),
  (8, 'build', '{"target":["I","am","seven"],"bank":["I","am","seven","eight","you","is"],"prompt_en":"Build: I am seven","prompt_ka":"ააგე: მე ვარ შვიდი","ka":"მე ვარ შვიდი"}'::jsonb)
) as v(ord, etype, data);
