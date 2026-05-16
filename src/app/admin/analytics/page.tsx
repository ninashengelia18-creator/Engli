import Link from 'next/link';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type EventRow = {
  name: string;
  user_id: string | null;
  props: Record<string, unknown> | null;
  created_at: string;
};

const WINDOW_DAYS = 14;

export default async function AdminAnalyticsPage() {
  const admin = createServiceRoleClient();
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const eventsQuery = await admin
    .from('analytics_events')
    .select('name, user_id, props, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(5000);

  if (eventsQuery.error) {
    return (
      <div>
        <h1 className="text-xl font-extrabold mb-2">Analytics</h1>
        <div className="card border-danger text-sm">
          <div className="font-bold text-danger mb-1">
            Couldn&apos;t load events
          </div>
          <div className="text-ink-light">{eventsQuery.error.message}</div>
          <p className="text-xs text-ink-light mt-2">
            Make sure the <code>20260517_analytics_events.sql</code> migration has been run.
          </p>
        </div>
      </div>
    );
  }

  const events: EventRow[] = eventsQuery.data ?? [];

  if (events.length === 0) {
    return (
      <div>
        <h1 className="text-xl font-extrabold mb-4">Analytics</h1>
        <div className="card text-center text-sm text-ink-light py-8 space-y-2">
          <div className="text-3xl">📊</div>
          <div className="font-bold text-ink">No events yet</div>
          <p>
            Events flow in as soon as learners start lessons. Try{' '}
            <Link href="/learn" className="text-secondary font-bold">
              opening the app
            </Link>{' '}
            and completing a lesson.
          </p>
        </div>
      </div>
    );
  }

  // -- Aggregate ---------------------------------------------------------------

  const counts: Record<string, number> = {};
  const uniqueUsersPerDay = new Map<string, Set<string>>();
  const stuckMap = new Map<string, { count: number; lesson_id: string | null }>();
  const upgradeFunnel = { views: 0, clicks: 0 };
  const onboardingByGoal: Record<string, number> = {};
  const lessonStarts = new Map<string, number>();
  const lessonCompletes = new Map<string, number>();
  const lessonAbandons = new Map<string, number>();

  for (const ev of events) {
    counts[ev.name] = (counts[ev.name] ?? 0) + 1;

    const day = ev.created_at.slice(0, 10);
    if (ev.user_id) {
      if (!uniqueUsersPerDay.has(day)) uniqueUsersPerDay.set(day, new Set());
      uniqueUsersPerDay.get(day)!.add(ev.user_id);
    }

    const props = ev.props ?? {};
    if (ev.name === 'exercise_stuck') {
      const exId = String(props.exercise_id ?? '');
      const prev = stuckMap.get(exId) ?? { count: 0, lesson_id: String(props.lesson_id ?? '') || null };
      stuckMap.set(exId, { count: prev.count + 1, lesson_id: prev.lesson_id });
    }
    if (ev.name === 'upgrade_view') upgradeFunnel.views += 1;
    if (ev.name === 'upgrade_click') upgradeFunnel.clicks += 1;
    if (ev.name === 'onboarding_complete') {
      const goal = String(props.goal ?? 'unknown');
      onboardingByGoal[goal] = (onboardingByGoal[goal] ?? 0) + 1;
    }
    if (ev.name === 'lesson_start') {
      const id = String(props.lesson_id ?? '');
      lessonStarts.set(id, (lessonStarts.get(id) ?? 0) + 1);
    }
    if (ev.name === 'lesson_complete') {
      const id = String(props.lesson_id ?? '');
      lessonCompletes.set(id, (lessonCompletes.get(id) ?? 0) + 1);
    }
    if (ev.name === 'lesson_abandon') {
      const id = String(props.lesson_id ?? '');
      lessonAbandons.set(id, (lessonAbandons.get(id) ?? 0) + 1);
    }
  }

  // Hydrate top-stuck exercises with lesson titles
  const topStuckIds = Array.from(stuckMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8);
  const stuckLessonIds = Array.from(
    new Set(topStuckIds.map(([, v]) => v.lesson_id).filter((v): v is string => !!v))
  );
  const { data: stuckLessonRows } = stuckLessonIds.length
    ? await admin.from('lessons').select('id, title_ka').in('id', stuckLessonIds)
    : { data: [] as { id: string; title_ka: string }[] };
  const lessonTitleById = new Map((stuckLessonRows ?? []).map((l) => [l.id, l.title_ka]));

  // Hydrate top lessons (by start)
  const topLessonIds = Array.from(lessonStarts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id]) => id)
    .filter(Boolean);
  const { data: topLessonRows } = topLessonIds.length
    ? await admin.from('lessons').select('id, title_ka, emoji').in('id', topLessonIds)
    : { data: [] as { id: string; title_ka: string; emoji: string | null }[] };
  const topLessonInfo = new Map(
    (topLessonRows ?? []).map((l) => [l.id, { title: l.title_ka, emoji: l.emoji ?? '📘' }])
  );

  // Build day series
  const dayKeys: string[] = [];
  for (let i = WINDOW_DAYS - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    dayKeys.push(d.toISOString().slice(0, 10));
  }
  const dauSeries = dayKeys.map((day) => ({
    day,
    dau: uniqueUsersPerDay.get(day)?.size ?? 0
  }));
  const maxDau = Math.max(1, ...dauSeries.map((d) => d.dau));

  const completionRate =
    counts['lesson_start'] > 0
      ? Math.round(((counts['lesson_complete'] ?? 0) / counts['lesson_start']) * 100)
      : 0;
  const abandonRate =
    counts['lesson_start'] > 0
      ? Math.round(((counts['lesson_abandon'] ?? 0) / counts['lesson_start']) * 100)
      : 0;
  const upgradeCtr =
    upgradeFunnel.views > 0
      ? Math.round((upgradeFunnel.clicks / upgradeFunnel.views) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-extrabold">Analytics</h1>
          <p className="text-xs text-ink-light">
            Last {WINDOW_DAYS} days · {events.length} events
          </p>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3">
        <Stat label="Lesson starts" value={counts['lesson_start'] ?? 0} />
        <Stat
          label="Completions"
          value={counts['lesson_complete'] ?? 0}
          hint={`${completionRate}% complete-rate`}
        />
        <Stat
          label="Abandons"
          value={counts['lesson_abandon'] ?? 0}
          hint={`${abandonRate}% abandon-rate`}
          tone={abandonRate > 30 ? 'warn' : undefined}
        />
        <Stat label="Onboardings" value={counts['onboarding_complete'] ?? 0} />
        <Stat label="Upgrade views" value={upgradeFunnel.views} />
        <Stat
          label="Upgrade clicks"
          value={upgradeFunnel.clicks}
          hint={`${upgradeCtr}% CTR`}
        />
      </section>

      <section>
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink-light mb-3">
          Daily active users
        </h2>
        <div className="card">
          <div className="flex items-end gap-1 h-32">
            {dauSeries.map((d) => (
              <div
                key={d.day}
                className="flex-1 flex flex-col items-center justify-end gap-1"
                title={`${d.day}: ${d.dau} users`}
              >
                <div className="text-[10px] text-ink-light">{d.dau}</div>
                <div
                  className="w-full bg-primary rounded-t"
                  style={{ height: `${(d.dau / maxDau) * 100}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-ink-lighter mt-2">
            <span>{dauSeries[0]?.day.slice(5)}</span>
            <span>{dauSeries[dauSeries.length - 1]?.day.slice(5)}</span>
          </div>
        </div>
      </section>

      {topLessonIds.length > 0 && (
        <section>
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink-light mb-3">
            Top lessons by starts
          </h2>
          <div className="space-y-2">
            {topLessonIds.map((id) => {
              const info = topLessonInfo.get(id);
              const starts = lessonStarts.get(id) ?? 0;
              const completes = lessonCompletes.get(id) ?? 0;
              const rate = starts > 0 ? Math.round((completes / starts) * 100) : 0;
              return (
                <div key={id} className="card text-sm flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="font-bold truncate">
                      {info?.emoji ?? '📘'} {info?.title ?? id.slice(0, 8)}
                    </div>
                    <div className="text-xs text-ink-light">
                      {starts} starts · {completes} completes
                    </div>
                  </div>
                  <div className="text-sm font-bold shrink-0 ml-3">{rate}%</div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {topStuckIds.length > 0 && (
        <section>
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink-light mb-3">
            Exercises learners get stuck on
          </h2>
          <div className="space-y-2">
            {topStuckIds.map(([exId, info]) => (
              <div key={exId} className="card text-sm flex items-center justify-between">
                <div className="min-w-0">
                  <div className="font-bold truncate">{info.count}× stuck</div>
                  <div className="text-xs text-ink-light truncate">
                    {info.lesson_id
                      ? `${lessonTitleById.get(info.lesson_id) ?? 'Lesson'} · ${exId.slice(0, 8)}…`
                      : `Exercise ${exId.slice(0, 8)}…`}
                  </div>
                </div>
                {info.lesson_id && (
                  <Link
                    href={`/admin/lessons/${info.lesson_id}/edit`}
                    className="text-xs font-bold text-secondary shrink-0 ml-3"
                  >
                    Open →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {Object.keys(onboardingByGoal).length > 0 && (
        <section>
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink-light mb-3">
            Onboarding goals
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(onboardingByGoal)
              .sort((a, b) => b[1] - a[1])
              .map(([goal, n]) => (
                <div key={goal} className="card text-sm">
                  <div className="text-xs text-ink-light uppercase tracking-wide">{goal}</div>
                  <div className="font-extrabold text-lg">{n}</div>
                </div>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  tone
}: {
  label: string;
  value: number;
  hint?: string;
  tone?: 'warn';
}) {
  return (
    <div className="card">
      <div className="text-xs text-ink-light uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-extrabold ${tone === 'warn' ? 'text-danger' : ''}`}>
        {value.toLocaleString()}
      </div>
      {hint && <div className="text-[11px] text-ink-light mt-0.5">{hint}</div>}
    </div>
  );
}
