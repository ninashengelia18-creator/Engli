import Link from 'next/link';
import { createServiceRoleClient } from '@/lib/supabase/server';

export default async function AdminLessonsPage() {
  const admin = createServiceRoleClient();
  const { data: lessons } = await admin
    .from('lessons')
    .select('id, title_ka, title_en, is_published, units(title_ka, worlds(title_ka)), exercises(count)')
    .order('display_order');

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-extrabold">Lessons</h1>
        <Link href="/admin/lessons/new" className="btn-primary text-sm px-3 py-2">
          + New lesson
        </Link>
      </div>
      <table className="w-full text-sm">
        <thead className="text-xs text-ink-light text-left">
          <tr>
            <th className="py-2">Title</th>
            <th>Unit</th>
            <th>Exercises</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {lessons?.map((l) => {
            const unit = Array.isArray(l.units) ? l.units[0] : l.units;
            const world = unit && (Array.isArray(unit.worlds) ? unit.worlds[0] : unit.worlds);
            const exerciseCount = Array.isArray(l.exercises)
              ? (l.exercises[0] as { count?: number } | undefined)?.count ?? 0
              : 0;
            return (
              <tr key={l.id} className="border-t border-border">
                <td className="py-2 font-bold">{l.title_ka}</td>
                <td className="text-ink-light">
                  {world?.title_ka} → {unit?.title_ka}
                </td>
                <td>{exerciseCount}</td>
                <td>{l.is_published ? '✅' : '📝'}</td>
                <td className="text-right">
                  <Link href={`/admin/lessons/${l.id}/edit`} className="text-secondary text-xs">
                    edit
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
