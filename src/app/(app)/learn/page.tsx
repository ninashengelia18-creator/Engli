import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Lock, Star, Crown } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

type LessonRow = {
  id: string;
  title_ka: string;
  emoji: string | null;
  display_order: number;
};
type UnitRow = {
  id: string;
  title_ka: string;
  emoji: string | null;
  is_premium: boolean;
  is_published: boolean;
  display_order: number;
  lessons: LessonRow[];
};

export default async function LearnPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('tier, status')
    .eq('user_id', user.id)
    .single();
  const isPremium =
    subscription?.tier !== 'free' &&
    (subscription?.status === 'active' || subscription?.status === 'trialing');

  const { data: worlds } = await supabase
    .from('worlds')
    .select('*, units(*, lessons(*))')
    .eq('is_published', true)
    .order('display_order');

  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('lesson_id, status, last_attempted_at')
    .eq('user_id', user.id);

  const completedSet = new Set(
    progress?.filter((p) => p.status === 'completed' || p.status === 'mastered').map((p) => p.lesson_id) ?? []
  );

  // Find the most recently attempted, not-yet-completed lesson — that's "continue"
  const lastAttempt = progress
    ?.filter((p) => p.status !== 'completed' && p.status !== 'mastered' && p.last_attempted_at)
    .sort((a, b) => (b.last_attempted_at ?? '').localeCompare(a.last_attempted_at ?? ''))[0];

  // Find the next eligible (unlocked, uncompleted) lesson across all worlds — current node
  let currentLessonId: string | null = null;
  for (const w of worlds ?? []) {
    if (currentLessonId) break;
    if (w.is_premium && !isPremium) continue;
    const units = ((w.units ?? []) as UnitRow[])
      .filter((u) => u.is_published)
      .sort((a, b) => a.display_order - b.display_order);
    for (const u of units) {
      if (currentLessonId) break;
      if (u.is_premium && !isPremium) continue;
      const lessons = (u.lessons ?? []).sort((a, b) => a.display_order - b.display_order);
      for (let i = 0; i < lessons.length; i++) {
        const l = lessons[i];
        if (completedSet.has(l.id)) continue;
        const prevDone = i === 0 || completedSet.has(lessons[i - 1].id);
        if (prevDone) {
          currentLessonId = l.id;
          break;
        }
      }
    }
  }

  if (!worlds?.length) {
    return (
      <main className="px-5 py-10">
        <EmptyState
          emoji="📚"
          title="ჯერ გაკვეთილები არ არის"
          description="მალე დაემატება ახალი გაკვეთილები. დაბრუნდი მოგვიანებით."
        />
      </main>
    );
  }

  return (
    <main className="px-5 py-4">
      {lastAttempt && (
        <Link
          href={`/lesson/${lastAttempt.lesson_id}`}
          className="block bg-secondary text-white rounded-2xl p-4 mb-5 shadow-[0_4px_0_0_#1899D6] active:translate-y-[2px] active:shadow-[0_2px_0_0_#1899D6] transition-all duration-75"
        >
          <div className="text-xs uppercase tracking-wide font-bold opacity-80">გააგრძელე იქიდან, სადაც გაჩერდი</div>
          <div className="font-extrabold text-lg mt-1">▶ გააგრძელე ვარჯიში</div>
        </Link>
      )}

      {worlds.map((world) => (
        <section key={world.id} className="mb-8">
          <div
            className="sticky top-[57px] z-10 -mx-1 rounded-2xl px-5 py-4 mb-4 text-white shadow-[0_4px_0_0_rgba(0,0,0,0.15)]"
            style={{ backgroundColor: world.color }}
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <h2 className="text-lg font-extrabold flex items-center gap-2">
                  <span aria-hidden="true">{world.emoji}</span>
                  <span className="truncate">{world.title_ka}</span>
                </h2>
                {world.description_ka && (
                  <p className="text-sm opacity-90 truncate">{world.description_ka}</p>
                )}
              </div>
              {world.is_premium && !isPremium && (
                <span className="chip bg-white/20 text-white border-white/30 backdrop-blur">
                  <Lock size={12} /> Premium
                </span>
              )}
            </div>
          </div>

          {((world.units ?? []) as UnitRow[])
            .filter((u) => u.is_published)
            .sort((a, b) => a.display_order - b.display_order)
            .map((unit) => {
              const unitLocked = unit.is_premium && !isPremium;
              const lessons = (unit.lessons ?? []).sort((a, b) => a.display_order - b.display_order);
              return (
                <div key={unit.id} className="mb-6">
                  <div className="flex items-center justify-between mb-3 px-2">
                    <h3 className="text-sm font-bold text-ink-light">
                      <span aria-hidden="true">{unit.emoji}</span> {unit.title_ka}
                    </h3>
                    {unit.is_premium && !isPremium && (
                      <span className="chip chip-accent">
                        <Crown size={12} /> Premium
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-4 items-center">
                    {lessons.map((lesson, i) => {
                      const completed = completedSet.has(lesson.id);
                      const prevDone = i === 0 || completedSet.has(lessons[i - 1].id);
                      const lockedByOrder = !prevDone;
                      const locked = unitLocked || lockedByOrder;
                      const offset = i % 2 === 0 ? '' : 'translate-x-12';
                      const isCurrent = lesson.id === currentLessonId;

                      const nodeClass = `lesson-node ${
                        completed ? 'lesson-node-completed' : ''
                      } ${unit.is_premium && !completed ? 'lesson-node-premium' : ''} ${
                        isCurrent ? 'lesson-node-current' : ''
                      }`;

                      return (
                        <div key={lesson.id} className={`flex flex-col items-center ${offset}`}>
                          {locked ? (
                            <div
                              className="lesson-node lesson-node-locked"
                              aria-label={`დაბლოკილია: ${lesson.title_ka}`}
                            >
                              <Lock size={28} className="text-ink-lighter" />
                            </div>
                          ) : (
                            <Link
                              href={`/lesson/${lesson.id}`}
                              aria-label={`${lesson.title_ka} ${completed ? '— დასრულებული' : ''}`}
                              className={nodeClass}
                            >
                              {completed ? (
                                <Star size={32} fill="white" className="text-white" />
                              ) : (
                                <span aria-hidden="true">{lesson.emoji}</span>
                              )}
                            </Link>
                          )}
                          <span
                            className={`text-xs font-bold mt-2 max-w-[120px] text-center ${
                              isCurrent ? 'text-secondary' : 'text-ink-light'
                            }`}
                          >
                            {lesson.title_ka}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </section>
      ))}

      {!isPremium && (
        <Link
          href="/upgrade"
          className="block bg-gradient-to-r from-purple to-secondary text-white rounded-2xl p-5 text-center font-extrabold shadow-[0_4px_0_0_#A560E8] active:translate-y-[2px] active:shadow-[0_2px_0_0_#A560E8] transition-all duration-75 mt-4"
        >
          <span aria-hidden="true">👑</span> გახსენი ყველა გაკვეთილი — Premium
        </Link>
      )}
    </main>
  );
}
