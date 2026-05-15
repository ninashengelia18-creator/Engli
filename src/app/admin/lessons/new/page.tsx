import Link from 'next/link';
import { createServiceRoleClient } from '@/lib/supabase/server';
import NewLessonForm from './NewLessonForm';

export const dynamic = 'force-dynamic';

export default async function NewLessonPage() {
  const admin = createServiceRoleClient();
  const { data: units } = await admin
    .from('units')
    .select('id, title_ka, title_en, worlds(title_ka)')
    .order('display_order');

  return (
    <div>
      <Link href="/admin/lessons" className="text-sm text-secondary">
        ← All lessons
      </Link>
      <h1 className="text-xl font-extrabold mt-1 mb-4">+ New Lesson</h1>
      {(!units || units.length === 0) ? (
        <div className="card text-center text-sm space-y-2 py-6">
          <p className="text-ink-light">
            No units exist yet. Create a world and unit before adding lessons.
          </p>
          <Link href="/admin/worlds/new" className="text-secondary font-bold">
            Create world →
          </Link>
        </div>
      ) : (
        <NewLessonForm units={units} />
      )}
    </div>
  );
}
