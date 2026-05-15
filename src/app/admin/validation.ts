// Hand-rolled validators for admin CRUD. Returning a discriminated union
// keeps callers honest without adding a zod dependency for this scope.

type Ok<T = void> = { ok: true } & (T extends void ? object : { normalized: T });
type Err = { ok: false; error: string };

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

function nonEmpty(value: unknown, label: string, max = 200): string | null {
  if (typeof value !== 'string') return `${label} is required`;
  const trimmed = value.trim();
  if (!trimmed) return `${label} is required`;
  if (trimmed.length > max) return `${label} is too long (max ${max} chars)`;
  return null;
}

function asString(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

export function validateWorldInput(
  input: {
    slug?: string;
    title_en: string;
    title_ka: string;
    description_en?: string;
    description_ka?: string;
    emoji?: string;
    color?: string;
  },
  opts: { requireSlug?: boolean } = { requireSlug: true }
): Ok | Err {
  if (opts.requireSlug !== false) {
    if (!input.slug || !SLUG_RE.test(input.slug.trim().toLowerCase())) {
      return { ok: false, error: 'Slug must be lowercase, dashes only (e.g. "intermediate-2")' };
    }
  }
  const tEn = nonEmpty(input.title_en, 'Title (English)');
  if (tEn) return { ok: false, error: tEn };
  const tKa = nonEmpty(input.title_ka, 'Title (Georgian)');
  if (tKa) return { ok: false, error: tKa };
  if (input.color && !COLOR_RE.test(input.color.trim())) {
    return { ok: false, error: 'Color must be a hex code like #58CC02' };
  }
  return { ok: true };
}

export function validateUnitInput(
  input: {
    world_id?: string;
    slug?: string;
    title_en: string;
    title_ka: string;
    emoji?: string;
  },
  opts: { requireSlug?: boolean; requireWorld?: boolean } = {}
): Ok | Err {
  if (opts.requireWorld !== false) {
    if (!input.world_id) return { ok: false, error: 'World is required' };
  }
  if (opts.requireSlug !== false) {
    if (!input.slug || !SLUG_RE.test(input.slug.trim().toLowerCase())) {
      return { ok: false, error: 'Slug must be lowercase, dashes only (e.g. "food-and-drink")' };
    }
  }
  const tEn = nonEmpty(input.title_en, 'Title (English)');
  if (tEn) return { ok: false, error: tEn };
  const tKa = nonEmpty(input.title_ka, 'Title (Georgian)');
  if (tKa) return { ok: false, error: tKa };
  return { ok: true };
}

export function validateLessonInput(
  input: {
    unit_id?: string;
    slug?: string;
    title_en: string;
    title_ka: string;
    emoji?: string;
    xp_reward: number;
  },
  opts: { requireSlug?: boolean; requireUnit?: boolean } = {}
): Ok | Err {
  if (opts.requireUnit !== false) {
    if (!input.unit_id) return { ok: false, error: 'Unit is required' };
  }
  if (opts.requireSlug !== false) {
    if (!input.slug || !SLUG_RE.test(input.slug.trim().toLowerCase())) {
      return { ok: false, error: 'Slug must be lowercase, dashes only' };
    }
  }
  const tEn = nonEmpty(input.title_en, 'Title (English)', 100);
  if (tEn) return { ok: false, error: tEn };
  const tKa = nonEmpty(input.title_ka, 'Title (Georgian)', 100);
  if (tKa) return { ok: false, error: tKa };
  if (!Number.isFinite(input.xp_reward) || input.xp_reward < 1 || input.xp_reward > 200) {
    return { ok: false, error: 'XP reward must be between 1 and 200' };
  }
  return { ok: true };
}

// ============================================================
// EXERCISES
// ============================================================

type Normalized = Record<string, unknown>;
type NormalizedOk = { ok: true; normalized: Normalized };

export function validateExercisePayload(
  type: string,
  data: Record<string, unknown>
): NormalizedOk | Err {
  switch (type) {
    case 'learn':
      return validateLearn(data);
    case 'match':
      return validateMatch(data);
    case 'listen':
      return validateListen(data);
    case 'speak':
      return validateSpeak(data);
    case 'build':
      return validateBuild(data);
    case 'translate':
      return validateTranslate(data);
    case 'story':
      return validateStory(data);
    default:
      return { ok: false, error: `Unsupported exercise type: ${type}` };
  }
}

// Soft per-field cap so a copy/paste accident can't drop a 1MB blob into
// the lesson JSON. Stays generous enough for paragraph-level translate
// exercises.
const MAX_FIELD_CHARS = 500;

function tooLong(value: string, label: string): Err | null {
  if (value.length > MAX_FIELD_CHARS) {
    return { ok: false, error: `${label} is too long (max ${MAX_FIELD_CHARS} chars)` };
  }
  return null;
}

function validateLearn(d: Record<string, unknown>): NormalizedOk | Err {
  const en = asString(d.en);
  const ka = asString(d.ka);
  if (!en) return { ok: false, error: 'English word is required' };
  if (!ka) return { ok: false, error: 'Georgian word is required' };
  const longEn = tooLong(en, 'English word');
  if (longEn) return longEn;
  const longKa = tooLong(ka, 'Georgian word');
  if (longKa) return longKa;
  return {
    ok: true,
    normalized: {
      emoji: asString(d.emoji) || '🔤',
      en,
      ka,
      sound: asString(d.sound) || en
    }
  };
}

function validateMatch(d: Record<string, unknown>): NormalizedOk | Err {
  const prompt_ka = asString(d.prompt_ka);
  if (!prompt_ka) return { ok: false, error: 'Georgian prompt is required' };
  const correct = asString(d.correct);
  if (!correct) return { ok: false, error: 'Correct answer is required' };
  const longPrompt = tooLong(prompt_ka, 'Georgian prompt');
  if (longPrompt) return longPrompt;
  const longCorrect = tooLong(correct, 'Correct answer');
  if (longCorrect) return longCorrect;

  const rawChoices = Array.isArray(d.choices) ? d.choices : [];
  const choices = rawChoices
    .map((c) => c as Record<string, unknown>)
    .filter((c) => asString(c.en))
    .map((c) => ({
      en: asString(c.en),
      ka: asString(c.ka),
      emoji: asString(c.emoji) || ''
    }));
  if (choices.length < 2) return { ok: false, error: 'Match needs at least 2 choices' };
  if (choices.length > 6) return { ok: false, error: 'Match has too many choices (max 6)' };

  // Catch the classic content-entry bug: two choices with the same English
  // text. The UI tap-targets get confusing and the correct-answer match is
  // ambiguous.
  const seen = new Set<string>();
  for (const c of choices) {
    const key = c.en.toLowerCase();
    if (seen.has(key)) {
      return { ok: false, error: `Duplicate choice "${c.en}" — each option must be unique` };
    }
    seen.add(key);
  }

  if (!choices.some((c) => c.en === correct)) {
    return {
      ok: false,
      error: `Correct answer "${correct}" must exactly match one of the choices' English text`
    };
  }
  return {
    ok: true,
    normalized: {
      prompt_en: asString(d.prompt_en),
      prompt_ka,
      correct,
      choices
    }
  };
}

function validateListen(d: Record<string, unknown>): NormalizedOk | Err {
  const match = validateMatch(d);
  if (!match.ok) return match;
  return {
    ok: true,
    normalized: {
      ...match.normalized,
      audio_url: asString(d.audio_url) || undefined
    }
  };
}

function validateSpeak(d: Record<string, unknown>): NormalizedOk | Err {
  const target = asString(d.target);
  const ka = asString(d.ka);
  if (!target) return { ok: false, error: 'Target English phrase is required' };
  if (!ka) return { ok: false, error: 'Georgian translation is required' };
  return {
    ok: true,
    normalized: {
      target,
      ka,
      prompt_en: asString(d.prompt_en) || `Say: ${target}`,
      prompt_ka: asString(d.prompt_ka) || `თქვი: ${target}`
    }
  };
}

function validateBuild(d: Record<string, unknown>): NormalizedOk | Err {
  const rawTarget = Array.isArray(d.target)
    ? (d.target as unknown[]).map(asString).filter(Boolean)
    : asString(d.target).split(/\s+/).filter(Boolean);
  if (rawTarget.length < 2) return { ok: false, error: 'Target sentence must have at least 2 words' };
  if (rawTarget.length > 12) {
    return { ok: false, error: 'Target sentence is too long (max 12 words)' };
  }
  for (const w of rawTarget) {
    if (w.length > 40) return { ok: false, error: `Word "${w}" is too long (max 40 chars)` };
  }
  const ka = asString(d.ka);
  if (!ka) return { ok: false, error: 'Georgian translation is required' };
  const longKa = tooLong(ka, 'Georgian translation');
  if (longKa) return longKa;
  const extras = Array.isArray(d.bank)
    ? (d.bank as unknown[]).map(asString).filter(Boolean)
    : [];
  // Ensure bank contains every target word; pad with extras; shuffle.
  const bankSet: string[] = [...rawTarget];
  for (const w of extras) {
    if (!bankSet.includes(w)) bankSet.push(w);
  }
  // Cap bank size so the UI doesn't become unwieldy.
  if (bankSet.length > 14) return { ok: false, error: 'Word bank is too large (max 14 words)' };
  return {
    ok: true,
    normalized: {
      target: rawTarget,
      bank: bankSet,
      prompt_en: `Build: ${rawTarget.join(' ')}`,
      prompt_ka: `ააგე: ${ka}`,
      ka
    }
  };
}

function validateTranslate(d: Record<string, unknown>): NormalizedOk | Err {
  const source_en = asString(d.source_en);
  const target_ka = asString(d.target_ka);
  if (!source_en) return { ok: false, error: 'English source is required' };
  if (!target_ka) return { ok: false, error: 'Georgian target is required' };
  const extra = Array.isArray(d.accept)
    ? (d.accept as unknown[]).map(asString).filter(Boolean)
    : [];
  const accept = Array.from(new Set([target_ka, ...extra]));
  return { ok: true, normalized: { source_en, target_ka, accept } };
}

function validateStory(d: Record<string, unknown>): NormalizedOk | Err {
  const rawScenes = Array.isArray(d.scenes) ? d.scenes : [];
  const scenes = rawScenes
    .map((s) => s as Record<string, unknown>)
    .filter((s) => asString(s.en) || asString(s.ka))
    .map((s) => ({
      image: asString(s.image) || '📖',
      en: asString(s.en),
      ka: asString(s.ka)
    }));
  if (scenes.length === 0) return { ok: false, error: 'Story needs at least one scene' };
  if (scenes.length > 10) return { ok: false, error: 'Story has too many scenes (max 10)' };

  const rawQs = Array.isArray(d.questions) ? d.questions : [];
  const questions = rawQs
    .map((q) => q as Record<string, unknown>)
    .filter((q) => asString(q.en) && asString(q.correct))
    .map((q) => {
      const choicesRaw = Array.isArray(q.choices) ? q.choices : [];
      return {
        en: asString(q.en),
        ka: asString(q.ka),
        correct: asString(q.correct),
        choices: Array.from(new Set(choicesRaw.map(asString).filter(Boolean)))
      };
    });

  // Each question's correct answer must appear in its choices, otherwise
  // the player can never pass.
  for (const [i, q] of questions.entries()) {
    if (q.choices.length < 2) {
      return { ok: false, error: `Question ${i + 1} needs at least 2 choices` };
    }
    if (!q.choices.includes(q.correct)) {
      return {
        ok: false,
        error: `Question ${i + 1}: correct answer "${q.correct}" is missing from its choices`
      };
    }
  }

  return { ok: true, normalized: { scenes, questions } };
}
