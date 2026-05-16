'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { X, Heart } from 'lucide-react';
import type { Exercise } from '@/types/db';
import LearnExercise from '@/components/lesson/LearnExercise';
import MatchExercise from '@/components/lesson/MatchExercise';
import BuildExercise from '@/components/lesson/BuildExercise';

// Inline, hand-authored sample lesson. Lives entirely in the browser — never
// hits Supabase, never grants real XP, never burns real hearts. The
// production lesson player is intentionally not reused: it would attempt
// auth + RPC calls and we want anyone to be able to try this offline.
const DEMO_EXERCISES: Exercise[] = [
  {
    id: 'demo-1',
    lesson_id: 'demo',
    display_order: 1,
    exercise_type: 'learn',
    data: { emoji: '🍎', en: 'apple', ka: 'ვაშლი', sound: 'apple' }
  },
  {
    id: 'demo-2',
    lesson_id: 'demo',
    display_order: 2,
    exercise_type: 'match',
    data: {
      prompt_ka: 'რომელია "ვაშლი"?',
      prompt_en: 'Which one is "apple"?',
      correct: 'apple',
      choices: [
        { en: 'apple', ka: 'ვაშლი', emoji: '🍎' },
        { en: 'banana', ka: 'ბანანი', emoji: '🍌' },
        { en: 'cat', ka: 'კატა', emoji: '🐱' },
        { en: 'dog', ka: 'ძაღლი', emoji: '🐶' }
      ]
    }
  },
  {
    id: 'demo-3',
    lesson_id: 'demo',
    display_order: 3,
    exercise_type: 'learn',
    data: { emoji: '🐶', en: 'dog', ka: 'ძაღლი', sound: 'dog' }
  },
  {
    id: 'demo-4',
    lesson_id: 'demo',
    display_order: 4,
    exercise_type: 'build',
    data: {
      prompt_ka: 'ააგე წინადადება',
      prompt_en: 'Build the sentence',
      ka: 'მე მიყვარს ვაშლი',
      target: ['I', 'like', 'apples'],
      bank: ['I', 'like', 'apples', 'cat', 'red', 'play']
    }
  }
];

export default function DemoLessonClient() {
  const [idx, setIdx] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [hearts, setHearts] = useState(3);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);
  const [showQuit, setShowQuit] = useState(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  const total = DEMO_EXERCISES.length;
  const ex = DEMO_EXERCISES[idx];
  const progress = Math.round(((idx + (feedback ? 1 : 0)) / total) * 100);

  function next() {
    setFeedback(null);
    if (idx + 1 >= total) {
      setDone(true);
    } else {
      setIdx(idx + 1);
    }
  }

  function handleResult(correct: boolean) {
    if (correct) {
      setCorrectCount((c) => c + 1);
      setFeedback('correct');
    } else {
      setHearts((h) => Math.max(0, h - 1));
      setFeedback('wrong');
    }
    advanceTimer.current = setTimeout(next, 900);
  }

  function handleLearnComplete() {
    setCorrectCount((c) => c + 1);
    setFeedback('correct');
    advanceTimer.current = setTimeout(next, 600);
  }

  if (done) {
    const score = Math.round((correctCount / total) * 100);
    return (
      <main className="flex flex-col flex-1 px-6 py-10 text-center items-center">
        <div className="text-7xl mb-3" aria-hidden="true">🎉</div>
        <h1 className="text-2xl font-extrabold text-primary mb-2">ბრავო!</h1>
        <p className="text-ink-light mb-6 max-w-xs">
          დაასრულე სატესტო გაკვეთილი {score}% შედეგით. სრულ კურსში 100+ გაკვეთილია, AI მასწავლებელი
          და ხმოვანი ვარჯიში.
        </p>

        <div className="grid grid-cols-3 gap-3 w-full max-w-xs mb-8 text-sm">
          <Stat label="XP" value="+15" />
          <Stat label="სიზუსტე" value={`${score}%`} />
          <Stat label="გული" value={`${hearts}/3`} />
        </div>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link href="/sign-up" className="btn-primary text-center">
            დაიწყე უფასოდ →
          </Link>
          <Link href="/" className="btn-secondary text-center">
            მთავარ გვერდზე
          </Link>
        </div>

        <p className="mt-8 text-xs text-ink-lighter max-w-xs">
          7 დღე უფასოდ. შემდეგ მხოლოდ ₾1/თვე. ნებისმიერ დროს გააუქმე.
        </p>
      </main>
    );
  }

  return (
    <main className="flex flex-col flex-1">
      <header className="px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => setShowQuit(true)}
          aria-label="გასვლა"
          className="p-2 -ml-2 rounded-lg active:bg-bg-soft"
        >
          <X size={22} />
        </button>
        <div className="flex-1 h-3 bg-bg-soft rounded-full overflow-hidden" aria-hidden="true">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center gap-1 text-error font-bold">
          <Heart size={18} fill="currentColor" />
          <span>{hearts}</span>
        </div>
      </header>

      <div className="px-2 pb-2 -mt-1 text-center">
        <span className="inline-block text-[10px] uppercase tracking-wider font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">
          სატესტო რეჟიმი · Demo
        </span>
      </div>

      <div className="flex-1 px-5 py-4 flex flex-col">
        {ex.exercise_type === 'learn' && (
          <LearnExercise
            data={ex.data as any}
            feedback={feedback}
            onComplete={handleLearnComplete}
          />
        )}
        {ex.exercise_type === 'match' && (
          <MatchExercise data={ex.data as any} feedback={feedback} onResult={handleResult} />
        )}
        {ex.exercise_type === 'build' && (
          <BuildExercise data={ex.data as any} feedback={feedback} onResult={handleResult} />
        )}
      </div>

      {feedback && (
        <div
          role="status"
          className={`px-5 py-3 text-center font-bold ${
            feedback === 'correct' ? 'text-primary' : 'text-error'
          }`}
        >
          {feedback === 'correct' ? '✓ მართალია!' : '✗ სცადე ისევ'}
        </div>
      )}

      {showQuit && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 text-center">
            <div className="text-4xl mb-2" aria-hidden="true">🦊</div>
            <h2 className="font-extrabold text-lg mb-2">გასვლა სატესტო გაკვეთილიდან?</h2>
            <p className="text-sm text-ink-light mb-5">
              გინდა შექმნა ანგარიში და გააგრძელო ნამდვილი კურსი?
            </p>
            <div className="flex flex-col gap-2">
              <Link href="/sign-up" className="btn-primary text-center">
                შექმენი ანგარიში
              </Link>
              <button onClick={() => setShowQuit(false)} className="btn-secondary">
                გავაგრძელო თამაში
              </button>
              <Link href="/" className="text-xs text-ink-light underline mt-2">
                მთავარზე დაბრუნება
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-3">
      <div className="text-xs text-ink-light">{label}</div>
      <div className="font-extrabold text-ink">{value}</div>
    </div>
  );
}
