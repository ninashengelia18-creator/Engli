import { createServiceRoleClient } from '@/lib/supabase/server';

export default async function AdminUsersPage() {
  const admin = createServiceRoleClient();
  const { data: profiles } = await admin
    .from('profiles')
    .select('*, subscriptions(tier, status)')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="text-xl font-extrabold mb-4">Users ({profiles?.length ?? 0})</h1>
      <div className="space-y-2">
        {profiles?.map((p) => {
          const sub = (p.subscriptions as unknown as { tier: string; status: string }[] | null)?.[0];
          const isPremium =
            sub?.tier !== 'free' && (sub?.status === 'active' || sub?.status === 'trialing');
          return (
            <div key={p.id} className="card flex items-center justify-between text-sm">
              <div>
                <div className="font-bold">
                  {p.child_name ?? p.display_name ?? 'Player'} {isPremium && '👑'}
                </div>
                <div className="text-xs text-ink-light">{p.email}</div>
              </div>
              <div className="text-right text-xs">
                <div>{p.xp} XP</div>
                <div className="text-ink-light">🔥 {p.current_streak}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
