'use client';

import { useState } from 'react';
import { Crown, Check, Heart, Brain, Trophy, Sparkles } from 'lucide-react';

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

  async function handleSubscribe() {
    setLoading(true);
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceKey: selected })
    });
    const { url } = await res.json();
    window.location.href = url;
  }

  return (
    <main className="px-5 py-6">
      <div className="text-center mb-6">
        <Crown size={48} className="text-accent mx-auto mb-3" fill="currentColor" />
        <h1 className="text-2xl font-extrabold mb-2">გახსენი ყველაფერი</h1>
        <p className="text-ink-light text-sm">7 დღე უფასოდ, შემდეგ მოთხოვნით</p>
      </div>

      <div className="space-y-3 mb-6">
        {FEATURES.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white">
              <Check size={18} />
            </div>
            <span className="font-semibold text-sm">{text}</span>
          </div>
        ))}
      </div>

      <div className="space-y-3 mb-6">
        {TIERS.map((tier) => (
          <button
            key={tier.key}
            onClick={() => setSelected(tier.key)}
            className={`w-full text-left rounded-2xl border-2 border-b-4 p-4 transition-all ${
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

      <button onClick={handleSubscribe} disabled={loading} className="btn-primary w-full">
        {loading ? '...' : 'დაიწყე უფასო ცდა'}
      </button>

      <p className="text-center text-[11px] text-ink-lighter mt-4">
        გადახდები გაიყიდება Stripe-ით. ცდის ხუთ დღეში გაყიდულის შემდეგ შეგიძლია გააუქმო.
      </p>
    </main>
  );
}
