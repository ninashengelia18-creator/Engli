'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getAdminUser } from '@/lib/admin';

async function assertAdmin() {
  const user = await getAdminUser();
  if (!user) redirect('/learn');
}

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
    .insert({ ...input, display_order })
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
  const admin = createServiceRoleClient();
  const { error } = await admin.from('lessons').update(input).eq('id', lessonId);
  if (error) return { error: error.message };
  revalidatePath(`/admin/lessons/${lessonId}/edit`);
  revalidatePath('/admin/lessons');
  return { ok: true };
}

export async function addExercise(input: {
  lesson_id: string;
  exercise_type: string;
  data: Record<string, unknown>;
}) {
  await assertAdmin();
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
    data: input.data,
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
