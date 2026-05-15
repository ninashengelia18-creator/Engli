import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServiceRoleClient } from '@/lib/supabase/server';
import EditUnitClient from './EditUnitClient';

export const dynamic = 'force-dynamic';

export default async function EditUnitPage({ params }: { params: { id: string } }) {
  const admin = createServiceRoleClient();
  const { data: unit } = await admin
    .from('units')
    .select('*, worlds(id, title_ka)')
    .eq('id', params.id)
    .single();
  if (!unit) notFound();

  const { data: lessons } = await admin
    .from('lessons')
    .select('id, slug, title_ka, title_en, emoji, display_order, is_published, exercises(count)')
    .eq('unit_id', params.id)
    .order('display_order');

  const world = Array.isArray(unit.worlds) ? unit.worlds[0] : unit.worlds;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/units" className="text-sm text-secondary">
          ← All units
        </Link>
        <h1 className="text-xl font-extrabold mt-1">
          {unit.emoji} {unit.title_ka}
        </h1>
        <p className="text-xs text-ink-light">
          {world?.title_ka} → {unit.title_en}
        </p>
      </div>

      <EditUnitClient unit={unit} />

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink-light">
            Lessons ({lessons?.length ?? 0})
          </h2>
          <Link href="/admin/lessons/new" className="text-xs font-bold text-secondary">
            + Add lesson
          </Link>
        </div>
        {(!lessons || lessons.length === 0) && (
          <div className="card text-center text-sm text-ink-light py-6">
            No lessons in this unit yet.
          </div>
        )}
        <div className="space-y-2">
          {lessons?.map((l) => {
            const exCount = Array.isArray(l.exercises)
              ? (l.exercises[0] as { count?: number } | undefined)?.count ?? 0
              : 0;
            return (
              <Link
                key={l.id}
                href={`/admin/lessons/${l.id}/edit`}
                className="card flex items-center justify-between hover:bg-bg-soft text-sm"
              >
                <div>
                  <div className="font-bold">
                    {l.emoji} {l.title_ka} {!l.is_published && '📝'}
                  </div>
                  <div className="text-xs text-ink-light">{l.title_en}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{exCount} exercises</div>
                  <div className="text-xs text-ink-light">#{l.display_order}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
