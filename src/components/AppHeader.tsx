'use client';

import type { Profile, Subscription } from '@/types/db';
import { Heart, Gem, Flame, Crown } from 'lucide-react';

export default function AppHeader({
  profile,
  subscription
}: {
  profile: Profile | null;
  subscription: Pick<Subscription, 'tier' | 'status'> | null;
}) {
  const isPremium = subscription?.tier !== 'free' && subscription?.status === 'active';

  return (
    <header className="sticky top-0 z-50 bg-white border-b-2 border-border px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {isPremium && <Crown size={20} className="text-accent" />}
        <span className="font-extrabold text-primary">ენგლი</span>
      </div>

      <div className="flex items-center gap-3 text-sm font-bold">
        <span className="flex items-center gap-1 text-accent">
          <Flame size={18} fill="currentColor" />
          {profile?.current_streak ?? 0}
        </span>
        <span className="flex items-center gap-1 text-secondary">
          <Gem size={18} fill="currentColor" />
          {profile?.gems ?? 0}
        </span>
        <span className="flex items-center gap-1 text-danger">
          <Heart size={18} fill="currentColor" />
          {profile?.hearts ?? 5}
        </span>
      </div>
    </header>
  );
}
