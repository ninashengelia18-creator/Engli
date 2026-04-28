'use client';

import { useState, useTransition } from 'react';
import { completeOnboarding } from './actions';
import type { LearningGoal } from '@/types/db';

const GOALS: { key: LearningGoal; emoji: string; title_ka: string; subtitle_ka: string }[] = [
  { key: 'school',  emoji: '🎒', title_ka: 'სკოლისთვის',     subtitle_ka: 'უკეთესი ნიშნები' },
  { key: 'travel',  emoji: '✈️', title_ka: 'მოგზაურობისთვის', subtitle_ka: 'უცხოეთში გასვლა' },
  { key: 'play',    emoji: '🎮', title_ka: 'თამაშისთვის',     subtitle_ka: 'ფილმები და თამაშები' },
  { key: 'future',  emoji: '🌟', title_ka: 'მომავლისთვის',    subtitle_ka: 'უკეთესი კარიერა' }
];

type Step = 0 | 1 | 2;

export default function OnboardingFlow() {
  const [step, setStep] = useState<Step>(0);
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState(9);
  const [learningGoal, setLearningGoal] = useState<LearningGoal | null>(null);
  const [isPending, startTransition] = useTransition();

  function next() {
    if (step === 0 && !childName.trim()) return;
    setStep((s) => (s + 1) as Step);
  }

  function finish(goal: LearningGoal) {
    setLearningGoal(goal);
    startTransition(() => {
      completeOnboarding({ childName: childName.trim(), childAge, learningGoal: goal });
    });
  }

  return (
    <main className="fixed inset-0 bg-white max-w-md mx-auto flex flex-col">
      <div className="px-5 pt-6 flex items-center justify-center gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all ${
              i === step ? 'w-8 bg-primary' : i < step ? 'w-2 bg-primary' : 'w-2 bg-border'
            }`}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col px-6 py-8 overflow-y-auto">
        {step === 0 && (
          <Step
            emoji="🦊"
            title="გამარჯობა! მე ვარ ფოქსი."
            subtitle="რა ჰქვია იმ ბავშვს, ვინც ისწავლის?"
          >
            <input
              autoFocus
              placeholder="ბავშვის სახელი"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && next()}
              className="border-2 border-border rounded-xl px-4 py-3 text-base focus:outline-none focus:border-secondary mt-6"
            />
            <button
              onClick={next}
              disabled={!childName.trim()}
              className="btn-primary mt-4 disabled:opacity-50"
            >
              გაგრძელება
            </button>
          </Step>
        )}

        {step === 1 && (
          <Step
            emoji="🎂"
            title={`რამდენი წლის არის ${childName}?`}
            subtitle="ჩვენ მოვარგებთ გაკვეთილებს"
          >
            <div className="text-center mt-8">
              <div className="text-6xl font-extrabold text-primary mb-4">{childAge}</div>
              <input
                type="range"
                min={7}
                max={12}
                value={childAge}
                onChange={(e) => setChildAge(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-ink-light mt-2 px-1">
                <span>7</span>
                <span>12</span>
              </div>
            </div>
            <button onClick={next} className="btn-primary mt-8">
              გაგრძელება
            </button>
          </Step>
        )}

        {step === 2 && (
          <Step
            emoji="🎯"
            title="რატომ სწავლობ ინგლისურს?"
            subtitle="აირჩიე ერთი მიზანი"
          >
            <div className="grid grid-cols-2 gap-3 mt-6">
              {GOALS.map((g) => (
                <button
                  key={g.key}
                  disabled={isPending}
                  onClick={() => finish(g.key)}
                  className={`rounded-2xl border-2 border-b-4 p-4 text-left transition-all ${
                    learningGoal === g.key
                      ? 'border-primary bg-green-50'
                      : 'border-border bg-white hover:border-primary'
                  } disabled:opacity-50`}
                >
                  <div className="text-3xl mb-2">{g.emoji}</div>
                  <div className="font-extrabold text-sm">{g.title_ka}</div>
                  <div className="text-xs text-ink-light mt-1">{g.subtitle_ka}</div>
                </button>
              ))}
            </div>
            {isPending && (
              <p className="text-center text-sm text-ink-light mt-6">იტვირთება...</p>
            )}
          </Step>
        )}
      </div>
    </main>
  );
}

function Step({
  emoji,
  title,
  subtitle,
  children
}: {
  emoji: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col flex-1">
      <div className="text-center mb-2">
        <div className="text-5xl mb-3">{emoji}</div>
        <h1 className="text-xl font-extrabold mb-1">{title}</h1>
        <p className="text-sm text-ink-light">{subtitle}</p>
      </div>
      <div className="flex flex-col flex-1 mt-2">{children}</div>
    </div>
  );
}
