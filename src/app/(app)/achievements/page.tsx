import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { Achievement } from '@/types/db';

export default async function AchievementsPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: catalog } = await supabase
    .from('achievements')
    .select('*')
    .order('xp_reward', { ascending: true });

  const { data: earned } = await supabase
    .from('user_achievements')
    .select('achievement_id, earned_at')
    .eq('user_id', user.id);

  const earnedMap = new Map(earned?.map((e) => [e.achievement_id, e.earned_at]) ?? []);
  const all = (catalog ?? []) as Achievement[];
  const earnedCount = all.filter((a) => earnedMap.has(a.id)).length;

  return (
    <main className="px-5 py-6">
      <Link href="/profile" className="text-ink-light text-sm">
        ← უკან
      </Link>

      <div className="text-center my-5">
        <div className="text-6xl mb-2" aria-hidden="true">🏅</div>
        <h1 className="text-2xl font-extrabold">მიღწევები</h1>
        <p className="text-sm text-ink-light">
          {earnedCount} / {all.length} მოპოვებული
        </p>
      </div>

      {all.length === 0 && (
        <p className="text-center text-sm text-ink-light">ჯერ მიღწევები არ არის</p>
      )}

      <ul className="space-y-3" aria-label="მიღწევები">
        {all.map((a) => {
          const earnedAt = earnedMap.get(a.id);
          const isEarned = !!earnedAt;
          return (
            <li
              key={a.id}
              className={`card flex items-center gap-3 ${
                isEarned ? 'border-accent bg-yellow-50' : 'opacity-70'
              }`}
              aria-label={`${a.title_ka}${isEarned ? ' — მოპოვებული' : ' — დაბლოკილი'}`}
            >
              <div
                className={`text-4xl ${isEarned ? '' : 'grayscale'}`}
                aria-hidden="true"
              >
                {a.emoji ?? '🏅'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-sm flex items-center gap-2">
                  {a.title_ka}
                  {isEarned && <span className="chip chip-accent text-[10px]">მოპოვებული</span>}
                </div>
                <div className="text-xs text-ink-light truncate">{a.description_ka}</div>
                {isEarned && (
                  <div className="text-[10px] text-ink-lighter mt-0.5">
                    {new Date(earnedAt!).toLocaleDateString('ka-GE')}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-secondary">+{a.xp_reward} XP</div>
                {a.gem_reward > 0 && (
                  <div className="text-[10px] text-ink-light">+{a.gem_reward} 💎</div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
