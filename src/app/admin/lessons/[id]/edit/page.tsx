import { notFound } from 'next/navigation';
import { createServiceRoleClient } from '@/lib/supabase/server';
import EditLessonClient from './EditLessonClient';
import LessonQualityChecks from './LessonQualityChecks';

export default async function EditLessonPage({ params }: { params: { id: string } }) {
  const admin = createServiceRoleClient();
  const { data: lesson } = await admin
    .from('lessons')
    .select('*, units(title_ka, worlds(title_ka))')
    .eq('id', params.id)
    .single();

  if (!lesson) notFound();

  const { data: exercises } = await admin
    .from('exercises')
    .select('*')
    .eq('lesson_id', params.id)
    .order('display_order');

  const exerciseList = exercises ?? [];

  return (
    <div className="space-y-6">
      <LessonQualityChecks exercises={exerciseList} />
      <EditLessonClient lesson={lesson} exercises={exerciseList} />
    </div>
  );
}
