import { createClient } from '@/lib/supabase/server';

export default async function AdminWorldsPage() {
  const supabase = createClient();
  const { data: worlds } = await supabase
    .from('worlds')
    .select('*, units(count)')
    .order('display_order');

  return (
    <div>
      <h1 className="text-xl font-extrabold mb-4">Worlds</h1>
      <div className="space-y-3">
        {worlds?.map((w) => (
          <div key={w.id} className="card flex items-center justify-between">
            <div>
              <div className="font-bold">
                {w.emoji} {w.title_ka}
                {w.is_premium && ' 👑'}
                {!w.is_published && ' 📝'}
              </div>
              <div className="text-xs text-ink-light">{w.title_en}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold">{w.units?.[0]?.count ?? 0} units</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
