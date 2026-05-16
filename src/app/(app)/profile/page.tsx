import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import SignOutButton from '@/components/SignOutButton';
import { Crown, Flame, Gem, Trophy, BarChart3 } from 'lucide-react';
import type { LearningGoal } from '@/types/db';

const GOAL_LABEL: Record<LearningGoal, { emoji: string; ka: string }> = {
  school: { emoji: '🎒', ka: 'სკოლისთვის' },
  travel: { emoji: '✈️', ka: 'მოგზაურობისთვის' },
  play: { emoji: '🎮', ka: 'თამაშისთვის' },
  future: { emoji: '🌟', ka: 'მომავლისთვის' }
};

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('tier, status, current_period_end')
    .eq('user_id', user.id)
    .single();

  const isPremium =
    subscription?.tier !== 'free' &&
    (subscription?.status === 'active' || subscription?.status === 'trialing');

  const goal: LearningGoal | null = profile?.learning_goal ?? null;
  const goalInfo = goal ? GOAL_LABEL[goal] : null;

  return (
    <main className="px-5 py-6">
      <div className="text-center mb-6">
        <div className="w-24 h-24 rounded-full bg-accent mx-auto mb-3 flex items-center justify-center text-5xl shadow-[0_4px_0_0_#E0AE00]">
          <span aria-hidden="true">🦊</span>
        </div>
        <h1 className="text-xl font-extrabold flex items-center justify-center gap-2">
          {profile?.child_name ?? 'Player'}
          {isPremium && <Crown size={18} className="text-accent" fill="currentColor" aria-label="Premium" />}
        </h1>
        <p className="text-sm text-ink-light">{profile?.email}</p>
        {(profile?.child_age || goalInfo) && (
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            {profile?.child_age && (
              <span className="chip chip-primary">
                <span aria-hidden="true">🎂</span> {profile.child_age} წლის
              </span>
            )}
            {goalInfo && (
              <span className="chip chip-accent">
                <span aria-hidden="true">{goalInfo.emoji}</span> {goalInfo.ka}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatBox icon={<Gem size={20} className="text-secondary" />} label="XP" value={profile?.xp ?? 0} />
        <StatBox icon={<Flame size={20} className="text-accent" />} label="სერია" value={profile?.current_streak ?? 0} />
        <StatBox icon={<Trophy size={20} className="text-purple" />} label="რეკორდი" value={profile?.longest_streak ?? 0} />
        <StatBox icon={<BarChart3 size={20} className="text-primary" />} label="ბრილიანტი" value={profile?.gems ?? 0} />
      </div>

      <div className={`card mb-3 ${isPremium ? 'border-accent bg-yellow-50' : ''}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-extrabold flex items-center gap-2">
              {isPremium ? (
                <>
                  <Crown size={18} className="text-accent" fill="currentColor" />
                  Premium
                </>
              ) : (
                'უფასო ვერსია'
              )}
            </div>
            <div className="text-xs text-ink-light mt-1">
              {isPremium
                ? `მოქმედებს ${new Date(subscription!.current_period_end!).toLocaleDateString('ka-GE')}-მდე`
                : 'შეზღუდული გაკვეთილები — გახსენი ყველაფერი'}
            </div>
          </div>
          {!isPremium && (
            <Link href="/upgrade" className="btn-primary text-xs px-3 py-2 shrink-0">
              გახსენი
            </Link>
          )}
        </div>
      </div>

      <Link
        href="/parent-dashboard"
        className="card mb-3 flex items-center justify-between active:translate-y-[1px] transition-transform duration-75"
      >
        <div>
          <div className="font-bold">
            <span aria-hidden="true">👪</span> მშობლის პანელი
          </div>
          <div className="text-xs text-ink-light">პროგრესის ნახვა</div>
        </div>
        <span className="text-ink-lighter">→</span>
      </Link>

      <SignOutButton />
    </main>
  );
}

function StatBox({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="card text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <div className="text-2xl font-extrabold tabular-nums">{value}</div>
      <div className="text-xs text-ink-light uppercase mt-1">{label}</div>
    </div>
  );
}
