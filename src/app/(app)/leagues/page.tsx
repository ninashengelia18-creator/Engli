import { createClient } from '@/lib/supabase/server';

export default async function LeaguesPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  // Simple leaderboard for MVP — top 30 by XP
  const { data: leaders } = await supabase
    .from('profiles')
    .select('id, child_name, display_name, xp, current_streak')
    .order('xp', { ascending: false })
    .limit(30);

  return (
    <main className="px-5 py-6">
      <div className="text-center mb-6">
        <div className="text-6xl mb-2">🏆</div>
        <h1 className="text-2xl font-extrabold">ლიგა</h1>
        <p className="text-sm text-ink-light">საუკეთესო მოთამაშეები</p>
      </div>

      <div className="space-y-2">
        {leaders?.map((p, i) => (
          <div
            key={p.id}
            className={`card flex items-center gap-3 ${
              p.id === user?.id ? 'border-primary bg-green-50' : ''
            }`}
          >
            <div className="w-8 text-center font-extrabold text-ink-light">{i + 1}</div>
            <div className="flex-1">
              <div className="font-bold text-sm">{p.child_name ?? p.display_name ?? 'Player'}</div>
              <div className="text-xs text-ink-light">🔥 {p.current_streak} day streak</div>
            </div>
            <div className="font-extrabold text-secondary">{p.xp} XP</div>
          </div>
        ))}
      </div>
    </main>
  );
}
