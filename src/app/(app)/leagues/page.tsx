import { createClient } from '@/lib/supabase/server';
import { EmptyState } from '@/components/ui/EmptyState';

const MEDALS = ['🥇', '🥈', '🥉'];

export default async function LeaguesPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: leaders } = await supabase
    .from('profiles')
    .select('id, child_name, display_name, xp, current_streak')
    .order('xp', { ascending: false })
    .limit(30);

  const empty = !leaders?.length;

  return (
    <main className="px-5 py-6">
      <div className="text-center mb-6">
        <div className="text-6xl mb-2" aria-hidden="true">🏆</div>
        <h1 className="text-2xl font-extrabold">ლიგა</h1>
        <p className="text-sm text-ink-light">საუკეთესო მოთამაშეები</p>
      </div>

      {empty && (
        <EmptyState
          emoji="🏁"
          title="ჯერ მონაწილეები არ არიან"
          description="დაიწყე გაკვეთილი და გახდი პირველი ლიდერი!"
        />
      )}

      <ol className="space-y-2" aria-label="რეიტინგი">
        {leaders?.map((p, i) => {
          const isMe = p.id === user?.id;
          const rank = i + 1;
          return (
            <li
              key={p.id}
              className={`card flex items-center gap-3 ${
                isMe ? 'border-primary bg-green-50' : ''
              }`}
            >
              <div className="w-10 text-center font-extrabold text-ink-light">
                {rank <= 3 ? (
                  <span className="text-2xl" aria-label={`ადგილი ${rank}`}>{MEDALS[rank - 1]}</span>
                ) : (
                  <span aria-label={`ადგილი ${rank}`}>{rank}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate">
                  {p.child_name ?? p.display_name ?? 'Player'}
                  {isMe && <span className="ml-2 chip chip-primary text-[10px]">შენ</span>}
                </div>
                <div className="text-xs text-ink-light">
                  <span aria-hidden="true">🔥</span> {p.current_streak} დღე ზედიზედ
                </div>
              </div>
              <div className="font-extrabold text-secondary tabular-nums">
                {p.xp} <span className="text-[11px]">XP</span>
              </div>
            </li>
          );
        })}
      </ol>
    </main>
  );
}
