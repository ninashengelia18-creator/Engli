import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Lock } from 'lucide-react';

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
    .select('lesson_id, status')
    .eq('user_id', user.id);

  const completedSet = new Set(
    progress?.filter((p) => p.status === 'completed' || p.status === 'mastered').map((p) => p.lesson_id) ?? []
  );

  return (
    <main className="px-5 py-6">
      {worlds?.map((world) => (
        <section key={world.id} className="mb-8">
          <div
            className="rounded-2xl px-5 py-4 mb-4 text-white shadow-[0_4px_0_0_rgba(0,0,0,0.15)]"
            style={{ backgroundColor: world.color }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold">
                  {world.emoji} {world.title_ka}
                </h2>
                <p className="text-sm opacity-90">{world.description_ka}</p>
              </div>
              {world.is_premium && !isPremium && <Lock size={20} />}
            </div>
          </div>

          {world.units
            ?.filter((u: { is_published: boolean }) => u.is_published)
            .sort((a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order)
            .map((unit: {
              id: string;
              title_ka: string;
              emoji: string | null;
              is_premium: boolean;
              lessons: {
                id: string;
                title_ka: string;
                emoji: string | null;
                display_order: number;
              }[];
            }) => {
              const unitLocked = unit.is_premium && !isPremium;
              return (
                <div key={unit.id} className="mb-6">
                  <h3 className="text-sm font-bold text-ink-light mb-3 px-2">
                    {unit.emoji} {unit.title_ka}
                  </h3>
                  <div className="flex flex-col gap-4 items-center">
                    {unit.lessons
                      ?.sort((a, b) => a.display_order - b.display_order)
                      .map((lesson, i) => {
                        const completed = completedSet.has(lesson.id);
                        const lockedByOrder =
                          i > 0 &&
                          !completedSet.has(unit.lessons.sort((a, b) => a.display_order - b.display_order)[i - 1].id);
                        const locked = unitLocked || lockedByOrder;
                        const offset = i % 2 === 0 ? '' : 'translate-x-12';

                        return (
                          <div key={lesson.id} className={`flex flex-col items-center ${offset}`}>
                            {locked ? (
                              <div className="lesson-node lesson-node-locked">
                                <Lock size={28} className="text-ink-lighter" />
                              </div>
                            ) : (
                              <Link
                                href={`/lesson/${lesson.id}`}
                                className={`lesson-node ${completed ? 'lesson-node-completed' : ''} ${
                                  unit.is_premium && !completed ? 'lesson-node-premium' : ''
                                }`}
                              >
                                {completed ? '⭐' : lesson.emoji}
                              </Link>
                            )}
                            <span className="text-xs font-bold text-ink-light mt-2 max-w-[120px] text-center">
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
          className="block bg-gradient-to-r from-purple to-secondary text-white rounded-2xl p-5 text-center font-extrabold shadow-[0_4px_0_0_#A560E8] mt-4"
        >
          👑 გახსენი ყველა გაკვეთილი — Premium
        </Link>
      )}
    </main>
  );
}
