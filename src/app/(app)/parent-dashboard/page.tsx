import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function ParentDashboardPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('lesson_id, status, best_score, lessons(title_ka, units(title_ka))')
    .eq('user_id', user.id)
    .order('last_attempted_at', { ascending: false })
    .limit(20);

  const { data: dailyXp } = await supabase
    .from('daily_xp')
    .select('date, xp_earned, lessons_completed')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(7);

  return (
    <main className="px-5 py-6">
      <Link href="/profile" className="text-ink-light text-sm">
        ← უკან
      </Link>

      <h1 className="text-xl font-extrabold mb-4 mt-2">👪 მშობლის პანელი</h1>

      <section className="mb-6">
        <h2 className="text-sm font-bold text-ink-light mb-3">ბოლო 7 დღე</h2>
        <div className="grid grid-cols-7 gap-1">
          {dailyXp?.reverse().map((d) => (
            <div key={d.date} className="card text-center p-2">
              <div className="text-[10px] text-ink-light">
                {new Date(d.date).toLocaleDateString('ka-GE', { weekday: 'short' })}
              </div>
              <div className="text-sm font-extrabold text-primary">{d.xp_earned}</div>
              <div className="text-[9px] text-ink-light">XP</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-bold text-ink-light mb-3">ბოლო გაკვეთილები</h2>
        <div className="space-y-2">
          {progress?.map((p) => {
            // Type narrowing for the joined data
            const lesson = p.lessons as unknown as { title_ka: string; units: { title_ka: string } } | null;
            return (
              <div key={p.lesson_id} className="card flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm">{lesson?.title_ka ?? 'Lesson'}</div>
                  <div className="text-xs text-ink-light">{lesson?.units?.title_ka}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-extrabold text-primary">{p.best_score}%</div>
                  <div className="text-xs">
                    {p.status === 'completed' ? '✅' : p.status === 'mastered' ? '🌟' : '⏳'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
