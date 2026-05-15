import Link from 'next/link';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminWorldsPage() {
  const admin = createServiceRoleClient();
  const { data: worlds, error } = await admin
    .from('worlds')
    .select('*, units(count)')
    .order('display_order');

  if (error) {
    return (
      <div>
        <h1 className="text-xl font-extrabold mb-4">Worlds</h1>
        <ErrorBanner message={error.message} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-extrabold">Worlds</h1>
        <Link href="/admin/worlds/new" className="btn-primary text-sm px-3 py-2">
          + New world
        </Link>
      </div>
      {worlds && worlds.length === 0 && (
        <div className="card text-center text-sm text-ink-light py-8">
          No worlds yet — start your curriculum by creating one.
        </div>
      )}
      <div className="space-y-3">
        {worlds?.map((w) => {
          const unitCount = Array.isArray(w.units)
            ? (w.units[0] as { count?: number } | undefined)?.count ?? 0
            : 0;
          return (
            <Link
              key={w.id}
              href={`/admin/worlds/${w.id}/edit`}
              className="card flex items-center justify-between hover:bg-bg-soft"
            >
              <div className="min-w-0">
                <div className="font-bold truncate">
                  {w.emoji} {w.title_ka}
                  {w.is_premium && ' 👑'}
                  {!w.is_published && ' 📝'}
                </div>
                <div className="text-xs text-ink-light truncate">{w.title_en}</div>
              </div>
              <div className="text-right shrink-0 ml-3">
                <div className="text-sm font-bold">{unitCount} units</div>
                <div className="text-xs text-ink-light">#{w.display_order}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="card border-danger text-sm">
      <div className="font-bold text-danger mb-1">Couldn&apos;t load worlds</div>
      <div className="text-ink-light">{message}</div>
    </div>
  );
}
