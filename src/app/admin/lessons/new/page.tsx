import { createServiceRoleClient } from '@/lib/supabase/server';
import NewLessonForm from './NewLessonForm';

export default async function NewLessonPage() {
  const admin = createServiceRoleClient();
  const { data: units } = await admin
    .from('units')
    .select('id, title_ka, title_en, worlds(title_ka)')
    .order('display_order');

  return (
    <div>
      <h1 className="text-xl font-extrabold mb-4">+ New Lesson</h1>
      <NewLessonForm units={units ?? []} />
    </div>
  );
}
