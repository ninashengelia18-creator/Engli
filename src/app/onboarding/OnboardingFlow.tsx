'use client';

import { useState, useTransition } from 'react';
import { completeOnboarding } from './actions';
import { track } from '@/lib/analytics';
import type { LearningGoal } from '@/types/db';

const GOALS: { key: LearningGoal; emoji: string; title_ka: string; subtitle_ka: string }[] = [
  { key: 'school', emoji: '🎒', title_ka: 'სკოლისთვის', subtitle_ka: 'უკეთესი ნიშნები' },
  { key: 'travel', emoji: '✈️', title_ka: 'მოგზაურობისთვის', subtitle_ka: 'უცხოეთში გასვლა' },
  { key: 'play', emoji: '🎮', title_ka: 'თამაშისთვის', subtitle_ka: 'ფილმები და თამაშები' },
  { key: 'future', emoji: '🌟', title_ka: 'მომავლისთვის', subtitle_ka: 'უკეთესი კარიერა' }
];

type Step = 0 | 1 | 2 | 3;

export default function OnboardingFlow() {
  const [step, setStep] = useState<Step>(0);
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState(9);
  const [learningGoal, setLearningGoal] = useState<LearningGoal | null>(null);
  const [isPending, startTransition] = useTransition();

  function next() {
    if (step === 1 && !childName.trim()) return;
    setStep((s) => (s + 1) as Step);
  }

  function back() {
    if (step === 0) return;
    setStep((s) => (s - 1) as Step);
  }

  function finish(goal: LearningGoal) {
    setLearningGoal(goal);
    track({ name: 'onboarding_complete', goal, age: childAge });
    startTransition(() => {
      completeOnboarding({ childName: childName.trim(), childAge, learningGoal: goal });
    });
  }

  return (
    <main className="fixed inset-0 bg-white max-w-md mx-auto flex flex-col">
      <div className="px-5 pt-6 flex items-center gap-3">
        {step > 0 && (
          <button
            onClick={back}
            aria-label="უკან"
            className="text-ink-light text-2xl leading-none px-2 py-1 -ml-2"
          >
            ←
          </button>
        )}
        <div className="flex-1 flex items-center justify-center gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === step ? 'w-8 bg-primary' : i < step ? 'w-2 bg-primary' : 'w-2 bg-border'
              }`}
              aria-hidden="true"
            />
          ))}
        </div>
        {step > 0 && <div className="w-8" aria-hidden="true" />}
      </div>

      <div className="flex-1 flex flex-col px-6 py-8 overflow-y-auto">
        {step === 0 && (
          <Step
            emoji="🦊"
            title="გამარჯობა! მე ვარ ფოქსი."
            subtitle="ერთად ვისწავლოთ ინგლისური — სახალისოდ, ცოტ-ცოტა ყოველ დღე."
          >
            <div className="grid grid-cols-3 gap-3 mt-8 mb-8">
              <Feature emoji="🎮" label="თამაშები" />
              <Feature emoji="🎤" label="ხმოვანი" />
              <Feature emoji="🤖" label="AI ფოქსი" />
            </div>
            <button onClick={next} className="btn-primary mt-auto w-full">
              დაიწყე
            </button>
          </Step>
        )}

        {step === 1 && (
          <Step
            emoji="✏️"
            title="რა გქვია?"
            subtitle="რა ჰქვია იმ ბავშვს, ვინც ისწავლის?"
          >
            <input
              autoFocus
              aria-label="ბავშვის სახელი"
              placeholder="ბავშვის სახელი"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && next()}
              maxLength={40}
              className="input mt-6"
            />
            <button
              onClick={next}
              disabled={!childName.trim()}
              className="btn-primary mt-4 w-full disabled:opacity-50"
            >
              გაგრძელება
            </button>
          </Step>
        )}

        {step === 2 && (
          <Step
            emoji="🎂"
            title={`რამდენი წლის ხარ, ${childName}?`}
            subtitle="ჩვენ მოვარგებთ გაკვეთილებს"
          >
            <div className="text-center mt-8">
              <div className="text-7xl font-extrabold text-primary mb-2 leading-none">{childAge}</div>
              <div className="text-sm text-ink-light mb-6">წლის</div>
              <input
                type="range"
                aria-label="ასაკი"
                min={6}
                max={14}
                value={childAge}
                onChange={(e) => setChildAge(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-ink-light mt-2 px-1">
                <span>6</span>
                <span>14</span>
              </div>
            </div>
            <button onClick={next} className="btn-primary mt-auto w-full">
              გაგრძელება
            </button>
          </Step>
        )}

        {step === 3 && (
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
                  aria-pressed={learningGoal === g.key}
                  className={`rounded-2xl border-2 border-b-4 p-4 text-left transition-all duration-75 active:translate-y-[2px] active:border-b-2 ${
                    learningGoal === g.key
                      ? 'border-primary bg-green-50'
                      : 'border-border bg-white'
                  } disabled:opacity-50`}
                >
                  <div className="text-3xl mb-2" aria-hidden="true">{g.emoji}</div>
                  <div className="font-extrabold text-sm">{g.title_ka}</div>
                  <div className="text-xs text-ink-light mt-1">{g.subtitle_ka}</div>
                </button>
              ))}
            </div>
            {isPending && (
              <p className="text-center text-sm text-ink-light mt-6" role="status">
                იტვირთება...
              </p>
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
        <div className="text-6xl mb-3" aria-hidden="true">{emoji}</div>
        <h1 className="text-xl font-extrabold mb-2 leading-tight">{title}</h1>
        <p className="text-sm text-ink-light max-w-xs mx-auto">{subtitle}</p>
      </div>
      <div className="flex flex-col flex-1 mt-2">{children}</div>
    </div>
  );
}

function Feature({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div className="card text-center py-4">
      <div className="text-3xl mb-1" aria-hidden="true">{emoji}</div>
      <div className="text-xs font-bold text-ink-light">{label}</div>
    </div>
  );
}
