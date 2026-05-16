'use client';

import type { Profile, Subscription } from '@/types/db';
import { Heart, Gem, Flame, Crown, Infinity as InfinityIcon } from 'lucide-react';

export default function AppHeader({
  profile,
  subscription
}: {
  profile: Profile | null;
  subscription: Pick<Subscription, 'tier' | 'status'> | null;
}) {
  const isPremium =
    subscription?.tier !== 'free' &&
    (subscription?.status === 'active' || subscription?.status === 'trialing');

  return (
    <header
      className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b-2 border-border px-4 py-3 flex items-center justify-between"
      style={{ paddingTop: 'calc(0.75rem + var(--safe-top))' }}
    >
      <div className="flex items-center gap-2">
        {isPremium && (
          <Crown size={20} className="text-accent" fill="currentColor" aria-label="Premium" />
        )}
        <span className="font-extrabold text-primary text-lg">ენგლი</span>
      </div>

      <div className="flex items-center gap-3 text-sm font-bold">
        <span className="flex items-center gap-1 text-accent" aria-label={`${profile?.current_streak ?? 0} day streak`}>
          <Flame size={18} fill="currentColor" />
          <span className="tabular-nums">{profile?.current_streak ?? 0}</span>
        </span>
        <span className="flex items-center gap-1 text-secondary" aria-label={`${profile?.gems ?? 0} gems`}>
          <Gem size={18} fill="currentColor" />
          <span className="tabular-nums">{profile?.gems ?? 0}</span>
        </span>
        <span
          className="flex items-center gap-1 text-danger"
          aria-label={isPremium ? 'unlimited hearts' : `${profile?.hearts ?? 5} hearts`}
        >
          <Heart size={18} fill="currentColor" />
          {isPremium ? (
            <InfinityIcon size={16} />
          ) : (
            <span className="tabular-nums">{profile?.hearts ?? 5}</span>
          )}
        </span>
      </div>
    </header>
  );
}
