import { createServiceRoleClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const admin = createServiceRoleClient();
  const { data: profiles, error } = await admin
    .from('profiles')
    .select('*, subscriptions(tier, status)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return (
      <div>
        <h1 className="text-xl font-extrabold mb-4">Users</h1>
        <div className="card border-danger text-sm text-danger">{error.message}</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-extrabold mb-4">Users ({profiles?.length ?? 0})</h1>
      {(!profiles || profiles.length === 0) && (
        <div className="card text-center text-sm text-ink-light py-8">No users yet.</div>
      )}
      <div className="space-y-2">
        {profiles?.map((p) => {
          const sub = (p.subscriptions as unknown as { tier: string; status: string }[] | null)?.[0];
          const isPremium =
            sub?.tier !== 'free' && (sub?.status === 'active' || sub?.status === 'trialing');
          return (
            <div key={p.id} className="card flex items-center justify-between text-sm">
              <div className="min-w-0">
                <div className="font-bold truncate">
                  {p.child_name ?? p.display_name ?? 'Player'} {isPremium && '👑'}
                </div>
                <div className="text-xs text-ink-light truncate">{p.email}</div>
              </div>
              <div className="text-right text-xs shrink-0 ml-3">
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
