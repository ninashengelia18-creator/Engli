import Link from 'next/link';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminLessonsPage() {
  const admin = createServiceRoleClient();
  const { data: lessons, error } = await admin
    .from('lessons')
    .select(
      'id, title_ka, title_en, is_published, units(title_ka, worlds(title_ka)), exercises(count)'
    )
    .order('display_order');

  if (error) {
    return (
      <div>
        <h1 className="text-xl font-extrabold mb-4">Lessons</h1>
        <div className="card border-danger text-sm text-danger">{error.message}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-extrabold">Lessons</h1>
        <Link href="/admin/lessons/new" className="btn-primary text-sm px-3 py-2">
          + New lesson
        </Link>
      </div>
      {(!lessons || lessons.length === 0) && (
        <div className="card text-center text-sm text-ink-light py-8 space-y-1">
          <div className="text-3xl">📘</div>
          <div className="font-bold text-ink">No lessons yet</div>
          <p>Create a world and unit first, then add lessons here.</p>
        </div>
      )}
      {lessons && lessons.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-ink-light text-left">
              <tr>
                <th className="py-2">Title</th>
                <th>Unit</th>
                <th className="text-right">Exercises</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((l) => {
                const unit = Array.isArray(l.units) ? l.units[0] : l.units;
                const world =
                  unit && (Array.isArray(unit.worlds) ? unit.worlds[0] : unit.worlds);
                const exerciseCount = Array.isArray(l.exercises)
                  ? (l.exercises[0] as { count?: number } | undefined)?.count ?? 0
                  : 0;
                const isEmpty = exerciseCount === 0;
                return (
                  <tr key={l.id} className="border-t border-border">
                    <td className="py-2 font-bold">{l.title_ka}</td>
                    <td className="text-ink-light">
                      {world?.title_ka} → {unit?.title_ka}
                    </td>
                    <td className={`text-right ${isEmpty ? 'text-danger font-bold' : ''}`}>
                      {exerciseCount}
                    </td>
                    <td>{l.is_published ? '✅' : '📝'}</td>
                    <td className="text-right">
                      <Link
                        href={`/admin/lessons/${l.id}/edit`}
                        className="text-secondary text-xs font-bold"
                      >
                        edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
