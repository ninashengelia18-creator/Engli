import { createClient } from '@/lib/supabase/server';

export default async function AdminLessonsPage() {
  const supabase = createClient();
  const { data: lessons } = await supabase
    .from('lessons')
    .select('*, units(title_ka, worlds(title_ka)), exercises(count)')
    .order('display_order');

  return (
    <div>
      <h1 className="text-xl font-extrabold mb-4">Lessons</h1>
      <p className="text-sm text-ink-light mb-4">
        To add new lessons, run SQL in Supabase or build a richer admin UI here.
      </p>
      <table className="w-full text-sm">
        <thead className="text-xs text-ink-light text-left">
          <tr>
            <th className="py-2">Title</th>
            <th>Unit</th>
            <th>Exercises</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {lessons?.map((l) => (
            <tr key={l.id} className="border-t border-border">
              <td className="py-2 font-bold">{l.title_ka}</td>
              <td className="text-ink-light">{l.units?.title_ka}</td>
              <td>{l.exercises?.[0]?.count ?? 0}</td>
              <td>{l.is_published ? '✅' : '📝'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
