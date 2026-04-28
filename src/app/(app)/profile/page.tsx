import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import SignOutButton from '@/components/SignOutButton';

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

  const isPremium = subscription?.tier !== 'free' && subscription?.status === 'active';

  return (
    <main className="px-5 py-6">
      <div className="text-center mb-6">
        <div className="w-20 h-20 rounded-full bg-accent mx-auto mb-3 flex items-center justify-center text-4xl">
          🦊
        </div>
        <h1 className="text-xl font-extrabold">{profile?.child_name ?? 'Player'}</h1>
        <p className="text-sm text-ink-light">{profile?.email}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatBox label="XP" value={profile?.xp ?? 0} />
        <StatBox label="სერია" value={profile?.current_streak ?? 0} />
        <StatBox label="ბრილიანტი" value={profile?.gems ?? 0} />
        <StatBox label="რეკორდი" value={profile?.longest_streak ?? 0} />
      </div>

      <div className={`card mb-3 ${isPremium ? 'border-accent bg-yellow-50' : ''}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-extrabold">{isPremium ? '👑 Premium' : 'უფასო ვერსია'}</div>
            <div className="text-xs text-ink-light mt-1">
              {isPremium
                ? `მოქმედებს ${new Date(subscription!.current_period_end!).toLocaleDateString('ka-GE')}-მდე`
                : 'შეზღუდული გაკვეთილები'}
            </div>
          </div>
          {!isPremium && (
            <Link href="/upgrade" className="btn-primary text-xs px-3 py-2">
              გახსენი
            </Link>
          )}
        </div>
      </div>

      <Link href="/parent-dashboard" className="card mb-3 block">
        <div className="font-bold">👪 მშობლის პანელი</div>
        <div className="text-xs text-ink-light">პროგრესის ნახვა</div>
      </Link>

      <SignOutButton />
    </main>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="card text-center">
      <div className="text-2xl font-extrabold">{value}</div>
      <div className="text-xs text-ink-light uppercase mt-1">{label}</div>
    </div>
  );
}
