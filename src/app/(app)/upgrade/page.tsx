'use client';

import { useEffect, useState } from 'react';
import { Crown, Check, Heart, Brain, Trophy, Sparkles } from 'lucide-react';
import { track } from '@/lib/analytics';

const TIERS = [
  {
    key: 'premium_monthly',
    title: 'Premium',
    price: '₾1',
    period: '/თვე',
    badge: 'გამშვები ფასი'
  }
];

const FEATURES = [
  { icon: Crown, text: 'ყველა გაკვეთილი გახსნილი' },
  { icon: Heart, text: 'უსასრულო გული — შეცდომის გარეშე' },
  { icon: Brain, text: 'AI მასწავლებლის საუბარი' },
  { icon: Trophy, text: 'ყველა ლიგაში მონაწილეობა' },
  { icon: Sparkles, text: 'რეკლამის გარეშე' }
];

export default function UpgradePage() {
  const [selected, setSelected] = useState('premium_monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    track({ name: 'upgrade_view' });
  }, []);

  async function handleSubscribe() {
    setLoading(true);
    setError(null);
    track({ name: 'upgrade_click', price_key: selected });
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceKey: selected })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Unknown' }));
        setError(body.error || 'შეცდომა — სცადე ხელახლა');
        setLoading(false);
        return;
      }
      const { url } = await res.json();
      if (url) window.location.href = url;
      else {
        setError('ვერ მოვძებნე გადახდის ბმული');
        setLoading(false);
      }
    } catch {
      setError('კავშირი ვერ მოხერხდა');
      setLoading(false);
    }
  }

  return (
    <main className="px-5 py-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-50 mb-3">
          <Crown size={40} className="text-accent" fill="currentColor" />
        </div>
        <h1 className="text-2xl font-extrabold mb-2">გახსენი ყველაფერი</h1>
        <p className="text-ink-light text-sm">7 დღე უფასოდ, შემდეგ მოთხოვნით</p>
      </div>

      <ul className="space-y-3 mb-6" aria-label="Premium-ის უპირატესობები">
        {FEATURES.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white flex-shrink-0">
              <Check size={18} />
            </div>
            <span className="font-semibold text-sm flex items-center gap-2">
              <Icon size={16} className="text-ink-light" aria-hidden="true" />
              {text}
            </span>
          </li>
        ))}
      </ul>

      <div className="space-y-3 mb-6" role="radiogroup" aria-label="არჩიე გეგმა">
        {TIERS.map((tier) => (
          <button
            key={tier.key}
            role="radio"
            aria-checked={selected === tier.key}
            onClick={() => setSelected(tier.key)}
            className={`w-full text-left rounded-2xl border-2 border-b-4 p-4 transition-all duration-75 active:translate-y-[2px] active:border-b-2 ${
              selected === tier.key ? 'border-primary bg-green-50' : 'border-border bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-extrabold">{tier.title}</div>
                {tier.badge && (
                  <div className="text-xs font-bold text-accent mt-1">{tier.badge}</div>
                )}
              </div>
              <div className="text-right">
                <div className="text-xl font-extrabold">{tier.price}</div>
                <div className="text-xs text-ink-light">{tier.period}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger bg-red-50 border border-danger/30 rounded-xl px-3 py-2 mb-3">
          {error}
        </p>
      )}

      <button onClick={handleSubscribe} disabled={loading} className="btn-primary w-full">
        {loading ? '...' : 'დაიწყე უფასო ცდა'}
      </button>

      <p className="text-center text-[11px] text-ink-lighter mt-4 leading-relaxed">
        გადახდები გაიყიდება Stripe-ით. შეგიძლია გააუქმო ნებისმიერ დროს.
      </p>
    </main>
  );
}
