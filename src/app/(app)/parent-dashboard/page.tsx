import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

const KA_DAY_LABEL = ['კვ', 'ორ', 'სა', 'ოთ', 'ხუ', 'პა', 'შა'];

function dayLabel(d: Date) {
  // KA weekday: getDay() 0=Sunday → 'კვ', 1=Monday → 'ორ', etc.
  return KA_DAY_LABEL[d.getDay()];
}

export default async function ParentDashboardPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('xp, current_streak, longest_streak, gems, current_league_tier')
    .eq('id', user.id)
    .single();

  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('lesson_id, status, best_score, total_time_seconds, last_attempted_at, lessons(title_ka, units(title_ka))')
    .eq('user_id', user.id)
    .order('last_attempted_at', { ascending: false })
    .limit(20);

  // Fetch the last 14 days of daily_xp, then pivot to a complete date series
  // so that days with zero activity still render (as empty bars).
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fourteenAgo = new Date(today);
  fourteenAgo.setDate(today.getDate() - 13);

  const { data: dailyXp } = await supabase
    .from('daily_xp')
    .select('date, xp_earned, lessons_completed')
    .eq('user_id', user.id)
    .gte('date', fourteenAgo.toISOString().slice(0, 10))
    .order('date', { ascending: true });

  const xpByDate = new Map<string, { xp: number; lessons: number }>();
  for (const row of dailyXp ?? []) {
    xpByDate.set(row.date, { xp: row.xp_earned ?? 0, lessons: row.lessons_completed ?? 0 });
  }
  const series: { date: Date; key: string; xp: number; lessons: number }[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(fourteenAgo);
    d.setDate(fourteenAgo.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const v = xpByDate.get(key) ?? { xp: 0, lessons: 0 };
    series.push({ date: d, key, xp: v.xp, lessons: v.lessons });
  }
  const peakXp = Math.max(10, ...series.map((s) => s.xp));
  const totalXp14 = series.reduce((sum, s) => sum + s.xp, 0);
  const totalLessons14 = series.reduce((sum, s) => sum + s.lessons, 0);
  const activeDays14 = series.filter((s) => s.xp > 0).length;
  const avgDaily = activeDays14 > 0 ? Math.round(totalXp14 / activeDays14) : 0;

  // Compute recent accuracy (% correct over last 50 attempts).
  const { data: attempts } = await supabase
    .from('exercise_attempts')
    .select('is_correct')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);
  const total = attempts?.length ?? 0;
  const correct = attempts?.filter((a) => a.is_correct).length ?? 0;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : null;

  // Time on task in the last 7 days (sum of total_time_seconds for the most
  // recently attempted lessons that overlap the window). This is approximate
  // because total_time_seconds is cumulative per lesson; we just sum.
  const recentSeconds = (progress ?? [])
    .filter((p) => {
      if (!p.last_attempted_at) return false;
      const t = new Date(p.last_attempted_at).getTime();
      return Date.now() - t < 7 * 86400_000;
    })
    .reduce((sum, p) => sum + (p.total_time_seconds ?? 0), 0);
  const minutes = Math.round(recentSeconds / 60);

  return (
    <main className="px-5 py-6">
      <Link href="/profile" className="text-ink-light text-sm">
        ← უკან
      </Link>

      <h1 className="text-xl font-extrabold mb-1 mt-2">
        <span aria-hidden="true">👪</span> მშობლის პანელი
      </h1>
      <p className="text-xs text-ink-light mb-5">ბავშვის პროგრესის მიმოხილვა</p>

      {/* Quick stats */}
      <section className="grid grid-cols-2 gap-3 mb-6" aria-label="ზოგადი სტატისტიკა">
        <StatCard label="სულ XP" value={profile?.xp ?? 0} icon="💎" />
        <StatCard label="სერია" value={`${profile?.current_streak ?? 0} დღე`} icon="🔥" />
        <StatCard label="რეკორდი" value={`${profile?.longest_streak ?? 0} დღე`} icon="🏆" />
        <StatCard
          label="სიზუსტე"
          value={accuracy === null ? '—' : `${accuracy}%`}
          icon="🎯"
        />
      </section>

      {/* 14-day chart */}
      <section className="mb-6">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm font-bold text-ink-light">ბოლო 14 დღე</h2>
          <span className="text-xs text-ink-light">
            {activeDays14}/14 აქტიური დღე
          </span>
        </div>
        <div
          className="card p-3"
          role="img"
          aria-label={`ბოლო 14 დღეში მოპოვებული XP, ჯამში ${totalXp14}`}
        >
          <div className="flex items-end justify-between gap-1 h-28">
            {series.map((s) => {
              const heightPct = peakXp > 0 ? (s.xp / peakXp) * 100 : 0;
              const isToday = s.key === today.toISOString().slice(0, 10);
              return (
                <div key={s.key} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-t-md transition-all duration-200 ${
                      s.xp > 0 ? 'bg-primary' : 'bg-border'
                    } ${isToday ? 'ring-2 ring-secondary' : ''}`}
                    style={{ height: `${Math.max(heightPct, s.xp > 0 ? 8 : 4)}%` }}
                    title={`${s.key}: ${s.xp} XP`}
                    aria-hidden="true"
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between gap-1 mt-1">
            {series.map((s, i) => (
              <div
                key={s.key}
                className="flex-1 text-center text-[9px] text-ink-light"
                aria-hidden="true"
              >
                {i % 2 === 0 ? dayLabel(s.date) : ''}
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          <MiniStat label="XP / დღე" value={avgDaily} />
          <MiniStat label="გაკვეთილი" value={totalLessons14} />
          <MiniStat label="წუთი (7დ)" value={minutes} />
        </div>
      </section>

      {/* Recent lessons */}
      <section>
        <h2 className="text-sm font-bold text-ink-light mb-3">ბოლო გაკვეთილები</h2>
        {(!progress || progress.length === 0) && (
          <p className="text-xs text-ink-light">ჯერ გაკვეთილი არ დაუწყია</p>
        )}
        <div className="space-y-2">
          {progress?.map((p) => {
            const lesson = p.lessons as unknown as {
              title_ka: string;
              units: { title_ka: string } | null;
            } | null;
            return (
              <div key={p.lesson_id} className="card flex items-center justify-between">
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate">{lesson?.title_ka ?? 'Lesson'}</div>
                  <div className="text-xs text-ink-light truncate">
                    {lesson?.units?.title_ka}
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
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

function StatCard({
  label,
  value,
  icon
}: {
  label: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div className="card text-center">
      <div className="text-2xl mb-1" aria-hidden="true">
        {icon}
      </div>
      <div className="text-lg font-extrabold tabular-nums">{value}</div>
      <div className="text-[10px] text-ink-light uppercase mt-0.5">{label}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card text-center p-2">
      <div className="text-base font-extrabold text-primary tabular-nums">{value}</div>
      <div className="text-[9px] text-ink-light uppercase">{label}</div>
    </div>
  );
}
