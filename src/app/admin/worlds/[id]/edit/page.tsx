import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServiceRoleClient } from '@/lib/supabase/server';
import EditWorldClient from './EditWorldClient';

export const dynamic = 'force-dynamic';

export default async function EditWorldPage({ params }: { params: { id: string } }) {
  const admin = createServiceRoleClient();
  const { data: world } = await admin.from('worlds').select('*').eq('id', params.id).single();
  if (!world) notFound();

  const { data: units } = await admin
    .from('units')
    .select('id, slug, title_ka, title_en, emoji, display_order, is_premium, is_published, lessons(count)')
    .eq('world_id', params.id)
    .order('display_order');

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/worlds" className="text-sm text-secondary">
          ← All worlds
        </Link>
        <h1 className="text-xl font-extrabold mt-1">
          {world.emoji} {world.title_ka}
        </h1>
        <p className="text-xs text-ink-light">{world.title_en}</p>
      </div>

      <EditWorldClient world={world} />

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink-light">
            Units ({units?.length ?? 0})
          </h2>
          <Link
            href={`/admin/units/new?world=${world.id}`}
            className="text-xs font-bold text-secondary"
          >
            + Add unit
          </Link>
        </div>
        {(!units || units.length === 0) && (
          <div className="card text-center text-sm text-ink-light py-6">
            No units yet — add one to start building lessons.
          </div>
        )}
        <div className="space-y-2">
          {units?.map((u) => {
            const lessonCount = Array.isArray(u.lessons)
              ? (u.lessons[0] as { count?: number } | undefined)?.count ?? 0
              : 0;
            return (
              <Link
                key={u.id}
                href={`/admin/units/${u.id}/edit`}
                className="card flex items-center justify-between hover:bg-bg-soft text-sm"
              >
                <div>
                  <div className="font-bold">
                    {u.emoji} {u.title_ka}
                    {u.is_premium && ' 👑'}
                    {!u.is_published && ' 📝'}
                  </div>
                  <div className="text-xs text-ink-light">{u.title_en}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{lessonCount} lessons</div>
                  <div className="text-xs text-ink-light">#{u.display_order}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
