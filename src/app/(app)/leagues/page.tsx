import { createClient } from '@/lib/supabase/server';
import { EmptyState } from '@/components/ui/EmptyState';

const MEDALS = ['🥇', '🥈', '🥉'];

const TIER_INFO: Record<number, { emoji: string; name_ka: string }> = {
  1: { emoji: '🥉', name_ka: 'ბრინჯაოს ლიგა' },
  2: { emoji: '🥈', name_ka: 'ვერცხლის ლიგა' },
  3: { emoji: '🥇', name_ka: 'ოქროს ლიგა' },
  4: { emoji: '💎', name_ka: 'საფირონის ლიგა' },
  5: { emoji: '💠', name_ka: 'ბრილიანტის ლიგა' }
};

type Standing = {
  league_id: string;
  user_id: string;
  weekly_xp: number;
  rank: number | null;
  tier: number;
  start_date: string;
  end_date: string;
  child_name: string | null;
  display_name: string | null;
  current_streak: number;
};

function daysUntil(endDate: string): number {
  const end = new Date(endDate + 'T23:59:59Z').getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((end - now) / 86400000));
}

export default async function LeaguesPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('current_league_tier')
    .eq('id', user.id)
    .single();

  const myTier = profile?.current_league_tier ?? 1;

  const { data: standings } = await supabase
    .from('v_current_league_standings')
    .select('*')
    .eq('tier', myTier)
    .order('weekly_xp', { ascending: false })
    .limit(50);

  const rows = (standings ?? []) as Standing[];
  const tierInfo = TIER_INFO[myTier] ?? TIER_INFO[1];
  const endDate = rows[0]?.end_date;
  const daysLeft = endDate ? daysUntil(endDate) : null;

  // Fallback: if weekly leagues haven't been provisioned yet (e.g. migration
  // not run, or no one has earned XP since), fall back to the global all-time
  // XP board so the page never looks empty pre-launch.
  let fallback: Standing[] | null = null;
  if (rows.length === 0) {
    const { data: allTime } = await supabase
      .from('profiles')
      .select('id, child_name, display_name, xp, current_streak')
      .order('xp', { ascending: false })
      .limit(30);
    fallback =
      allTime?.map((p) => ({
        league_id: '',
        user_id: p.id,
        weekly_xp: p.xp ?? 0,
        rank: null,
        tier: myTier,
        start_date: '',
        end_date: '',
        child_name: p.child_name,
        display_name: p.display_name,
        current_streak: p.current_streak ?? 0
      })) ?? [];
  }

  const display = rows.length > 0 ? rows : fallback ?? [];
  const isFallback = rows.length === 0;

  return (
    <main className="px-5 py-6">
      <div className="text-center mb-5">
        <div className="text-6xl mb-2" aria-hidden="true">{tierInfo.emoji}</div>
        <h1 className="text-2xl font-extrabold">{tierInfo.name_ka}</h1>
        <p className="text-sm text-ink-light">
          {isFallback
            ? 'საუკეთესო მოთამაშეები'
            : daysLeft !== null
              ? daysLeft === 0
                ? 'ბოლო დღე — შენი ადგილი ხვალ წყდება!'
                : `კიდევ ${daysLeft} დღე ამ კვირაში`
              : 'საუკეთესო მოთამაშეები'}
        </p>
        {!isFallback && myTier < 5 && (
          <p className="mt-2 text-xs text-ink-light">
            ტოპ 7 — ზემოთ ლიგაში
            {myTier > 1 ? ' · ბოლო 5 — ქვემოთ' : ''}
          </p>
        )}
      </div>

      {display.length === 0 && (
        <EmptyState
          emoji="🏁"
          title="ჯერ მონაწილეები არ არიან"
          description="დაიწყე გაკვეთილი და გახდი პირველი ლიდერი!"
        />
      )}

      <ol className="space-y-2" aria-label="რეიტინგი">
        {display.map((p, i) => {
          const isMe = p.user_id === user.id;
          const rank = p.rank ?? i + 1;
          const promoteZone = !isFallback && myTier < 5 && rank <= 7;
          const demoteZone =
            !isFallback &&
            myTier > 1 &&
            display.length >= 10 &&
            rank > display.length - 5;
          const zoneClass = promoteZone
            ? 'border-l-4 border-l-primary'
            : demoteZone
              ? 'border-l-4 border-l-danger/60'
              : '';
          return (
            <li
              key={p.user_id}
              className={`card flex items-center gap-3 ${
                isMe ? 'border-primary bg-green-50' : ''
              } ${zoneClass}`}
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
                {p.weekly_xp} <span className="text-[11px]">XP</span>
              </div>
            </li>
          );
        })}
      </ol>
    </main>
  );
}
