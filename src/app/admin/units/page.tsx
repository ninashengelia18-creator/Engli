import Link from 'next/link';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminUnitsPage() {
  const admin = createServiceRoleClient();
  const { data: units, error } = await admin
    .from('units')
    .select(
      'id, slug, title_ka, title_en, emoji, display_order, is_premium, is_published, worlds(title_ka), lessons(count)'
    )
    .order('display_order');

  if (error) {
    return (
      <div>
        <h1 className="text-xl font-extrabold mb-4">Units</h1>
        <div className="card border-danger text-sm text-danger">{error.message}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-extrabold">Units</h1>
        <Link href="/admin/units/new" className="btn-primary text-sm px-3 py-2">
          + New unit
        </Link>
      </div>
      {(!units || units.length === 0) && (
        <div className="card text-center text-sm text-ink-light py-8">
          No units yet — create a world first, then add units to it.
        </div>
      )}
      <div className="space-y-2">
        {units?.map((u) => {
          const world = Array.isArray(u.worlds) ? u.worlds[0] : u.worlds;
          const lessonCount = Array.isArray(u.lessons)
            ? (u.lessons[0] as { count?: number } | undefined)?.count ?? 0
            : 0;
          return (
            <Link
              key={u.id}
              href={`/admin/units/${u.id}/edit`}
              className="card flex items-center justify-between hover:bg-bg-soft text-sm"
            >
              <div className="min-w-0">
                <div className="font-bold truncate">
                  {u.emoji} {u.title_ka}
                  {u.is_premium && ' 👑'}
                  {!u.is_published && ' 📝'}
                </div>
                <div className="text-xs text-ink-light truncate">
                  {world?.title_ka ?? '?'} · {u.title_en}
                </div>
              </div>
              <div className="text-right shrink-0 ml-3">
                <div className="font-bold">{lessonCount} lessons</div>
                <div className="text-xs text-ink-light">#{u.display_order}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
