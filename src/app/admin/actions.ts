'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getAdminUser } from '@/lib/admin';
import {
  validateExercisePayload,
  validateLessonInput,
  validateUnitInput,
  validateWorldInput
} from './validation';

async function assertAdmin() {
  const user = await getAdminUser();
  if (!user) redirect('/learn');
}

type Result<T = void> = { ok: true; data?: T } | { ok: false; error: string };

// ============================================================
// WORLDS
// ============================================================

export async function createWorld(input: {
  slug: string;
  title_en: string;
  title_ka: string;
  description_en?: string;
  description_ka?: string;
  emoji?: string;
  color?: string;
  is_premium: boolean;
  is_published: boolean;
}): Promise<Result<{ id: string }>> {
  await assertAdmin();
  const validation = validateWorldInput(input);
  if (!validation.ok) return validation;

  const admin = createServiceRoleClient();

  const { data: maxRow } = await admin
    .from('worlds')
    .select('display_order')
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  const display_order = (maxRow?.display_order ?? 0) + 1;

  const { data, error } = await admin
    .from('worlds')
    .insert({
      slug: input.slug.trim().toLowerCase(),
      title_en: input.title_en.trim(),
      title_ka: input.title_ka.trim(),
      description_en: input.description_en?.trim() || null,
      description_ka: input.description_ka?.trim() || null,
      emoji: input.emoji?.trim() || '🌱',
      color: input.color?.trim() || '#58CC02',
      is_premium: input.is_premium,
      is_published: input.is_published,
      display_order
    })
    .select('id')
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/worlds');
  return { ok: true, data: { id: data.id } };
}

export async function updateWorld(
  worldId: string,
  input: {
    title_en: string;
    title_ka: string;
    description_en?: string;
    description_ka?: string;
    emoji?: string;
    color?: string;
    is_premium: boolean;
    is_published: boolean;
  }
): Promise<Result> {
  await assertAdmin();
  const validation = validateWorldInput(input, { requireSlug: false });
  if (!validation.ok) return validation;

  const admin = createServiceRoleClient();
  const { error } = await admin
    .from('worlds')
    .update({
      title_en: input.title_en.trim(),
      title_ka: input.title_ka.trim(),
      description_en: input.description_en?.trim() || null,
      description_ka: input.description_ka?.trim() || null,
      emoji: input.emoji?.trim() || '🌱',
      color: input.color?.trim() || '#58CC02',
      is_premium: input.is_premium,
      is_published: input.is_published
    })
    .eq('id', worldId);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/worlds');
  revalidatePath(`/admin/worlds/${worldId}/edit`);
  return { ok: true };
}

// ============================================================
// UNITS
// ============================================================

export async function createUnit(input: {
  world_id: string;
  slug: string;
  title_en: string;
  title_ka: string;
  emoji?: string;
  is_premium: boolean;
  is_published: boolean;
}): Promise<Result<{ id: string }>> {
  await assertAdmin();
  const validation = validateUnitInput(input);
  if (!validation.ok) return validation;

  const admin = createServiceRoleClient();

  const { data: maxRow } = await admin
    .from('units')
    .select('display_order')
    .eq('world_id', input.world_id)
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  const display_order = (maxRow?.display_order ?? 0) + 1;

  const { data, error } = await admin
    .from('units')
    .insert({
      world_id: input.world_id,
      slug: input.slug.trim().toLowerCase(),
      title_en: input.title_en.trim(),
      title_ka: input.title_ka.trim(),
      emoji: input.emoji?.trim() || '📚',
      is_premium: input.is_premium,
      is_published: input.is_published,
      display_order
    })
    .select('id')
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/units');
  revalidatePath('/admin/worlds');
  return { ok: true, data: { id: data.id } };
}

export async function updateUnit(
  unitId: string,
  input: {
    title_en: string;
    title_ka: string;
    emoji?: string;
    is_premium: boolean;
    is_published: boolean;
  }
): Promise<Result> {
  await assertAdmin();
  const validation = validateUnitInput(
    { ...input, world_id: 'placeholder', slug: 'placeholder' },
    { requireSlug: false, requireWorld: false }
  );
  if (!validation.ok) return validation;

  const admin = createServiceRoleClient();
  const { error } = await admin
    .from('units')
    .update({
      title_en: input.title_en.trim(),
      title_ka: input.title_ka.trim(),
      emoji: input.emoji?.trim() || '📚',
      is_premium: input.is_premium,
      is_published: input.is_published
    })
    .eq('id', unitId);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/units');
  revalidatePath(`/admin/units/${unitId}/edit`);
  return { ok: true };
}

// ============================================================
// LESSONS
// ============================================================

export async function createLesson(input: {
  unit_id: string;
  slug: string;
  title_en: string;
  title_ka: string;
  emoji: string;
  xp_reward: number;
  is_published: boolean;
}) {
  await assertAdmin();
  const validation = validateLessonInput(input);
  if (!validation.ok) return { error: validation.error };

  const admin = createServiceRoleClient();

  const { data: maxRow } = await admin
    .from('lessons')
    .select('display_order')
    .eq('unit_id', input.unit_id)
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  const display_order = (maxRow?.display_order ?? 0) + 1;

  const { data, error } = await admin
    .from('lessons')
    .insert({
      ...input,
      slug: input.slug.trim().toLowerCase(),
      title_en: input.title_en.trim(),
      title_ka: input.title_ka.trim(),
      emoji: input.emoji?.trim() || '📘',
      display_order
    })
    .select('id')
    .single();

  if (error) return { error: error.message };
  revalidatePath('/admin/lessons');
  redirect(`/admin/lessons/${data.id}/edit`);
}

export async function updateLesson(
  lessonId: string,
  input: { title_en: string; title_ka: string; emoji: string; xp_reward: number; is_published: boolean }
) {
  await assertAdmin();
  const validation = validateLessonInput(
    { ...input, slug: 'placeholder', unit_id: 'placeholder' },
    { requireSlug: false, requireUnit: false }
  );
  if (!validation.ok) return { error: validation.error };

  const admin = createServiceRoleClient();
  const { error } = await admin
    .from('lessons')
    .update({
      title_en: input.title_en.trim(),
      title_ka: input.title_ka.trim(),
      emoji: input.emoji?.trim() || '📘',
      xp_reward: input.xp_reward,
      is_published: input.is_published
    })
    .eq('id', lessonId);
  if (error) return { error: error.message };
  revalidatePath(`/admin/lessons/${lessonId}/edit`);
  revalidatePath('/admin/lessons');
  return { ok: true };
}

export async function deleteLesson(lessonId: string): Promise<Result> {
  await assertAdmin();
  const admin = createServiceRoleClient();
  const { error } = await admin.from('lessons').delete().eq('id', lessonId);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/lessons');
  return { ok: true };
}

// ============================================================
// EXERCISES
// ============================================================

export async function addExercise(input: {
  lesson_id: string;
  exercise_type: string;
  data: Record<string, unknown>;
}) {
  await assertAdmin();
  const validation = validateExercisePayload(input.exercise_type, input.data);
  if (!validation.ok) return { error: validation.error };

  const admin = createServiceRoleClient();

  const { data: maxRow } = await admin
    .from('exercises')
    .select('display_order')
    .eq('lesson_id', input.lesson_id)
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  const display_order = (maxRow?.display_order ?? 0) + 1;

  const { error } = await admin.from('exercises').insert({
    lesson_id: input.lesson_id,
    exercise_type: input.exercise_type,
    data: validation.normalized,
    display_order
  });

  if (error) return { error: error.message };
  revalidatePath(`/admin/lessons/${input.lesson_id}/edit`);
  return { ok: true };
}

export async function deleteExercise(exerciseId: string, lessonId: string) {
  await assertAdmin();
  const admin = createServiceRoleClient();
  const { error } = await admin.from('exercises').delete().eq('id', exerciseId);
  if (error) return { error: error.message };
  revalidatePath(`/admin/lessons/${lessonId}/edit`);
  return { ok: true };
}

export async function reorderExercise(
  exerciseId: string,
  lessonId: string,
  direction: 'up' | 'down'
): Promise<Result> {
  await assertAdmin();
  const admin = createServiceRoleClient();

  const { data: rows } = await admin
    .from('exercises')
    .select('id, display_order')
    .eq('lesson_id', lessonId)
    .order('display_order');

  if (!rows || rows.length === 0) return { ok: false, error: 'No exercises found' };

  const idx = rows.findIndex((r) => r.id === exerciseId);
  if (idx < 0) return { ok: false, error: 'Exercise not found' };
  const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= rows.length) return { ok: false, error: 'Cannot reorder past edge' };

  const a = rows[idx];
  const b = rows[swapIdx];
  // Swap display orders. Use a temporary value to avoid unique conflicts if any.
  const tmpA = -Math.abs(a.display_order) - 1;
  await admin.from('exercises').update({ display_order: tmpA }).eq('id', a.id);
  await admin.from('exercises').update({ display_order: a.display_order }).eq('id', b.id);
  await admin.from('exercises').update({ display_order: b.display_order }).eq('id', a.id);

  revalidatePath(`/admin/lessons/${lessonId}/edit`);
  return { ok: true };
}
