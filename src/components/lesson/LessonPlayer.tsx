'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Exercise } from '@/types/db';
import LearnExercise from './LearnExercise';
import MatchExercise from './MatchExercise';
import SpeakExercise from './SpeakExercise';
import BuildExercise from './BuildExercise';
import ListenExercise from './ListenExercise';
import TranslateExercise from './TranslateExercise';
import LessonComplete from './LessonComplete';

type Props = {
  lessonId: string;
  lessonTitle: string;
  exercises: Exercise[];
  xpReward: number;
};

export default function LessonPlayer({ lessonId, lessonTitle, exercises, xpReward }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [idx, setIdx] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [done, setDone] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [startedAt] = useState(Date.now());

  const ex = exercises[idx];
  const progress = (idx / exercises.length) * 100;

  async function handleResult(correct: boolean) {
    setFeedback(correct ? 'correct' : 'wrong');
    if (!correct) setMistakes((m) => m + 1);

    // Log exercise attempt (best-effort). RLS scopes user_id to auth.uid().
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('exercise_attempts').insert({
        user_id: user.id,
        exercise_id: ex.id,
        is_correct: correct
      });
      if (!correct) {
        try {
          await supabase.rpc('decrement_hearts');
        } catch {
          // best-effort; ignore if RPC fails
        }
      }
    }
  }

  async function handleNext() {
    setFeedback(null);
    if (idx + 1 >= exercises.length) {
      // Server-side: validates lesson, writes progress, awards XP atomically.
      // Client-side XP/mistake counts are advisory only — the server uses the
      // lesson's canonical xp_reward.
      try {
        await fetch('/api/lesson/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lessonId,
            mistakes,
            seconds: Math.floor((Date.now() - startedAt) / 1000)
          })
        });
      } catch {
        // best-effort; the user still sees the completion screen
      }
      setDone(true);
    } else {
      setIdx(idx + 1);
    }
  }

  if (done) {
    return <LessonComplete xpEarned={xpReward} mistakes={mistakes} lessonTitle={lessonTitle} />;
  }

  if (!ex) return null;

  const renderExercise = () => {
    switch (ex.exercise_type) {
      case 'learn':
        return <LearnExercise data={ex.data as never} feedback={feedback} onComplete={() => handleResult(true)} />;
      case 'match':
        return <MatchExercise data={ex.data as never} feedback={feedback} onResult={handleResult} />;
      case 'speak':
        return <SpeakExercise data={ex.data as never} feedback={feedback} onResult={handleResult} />;
      case 'build':
        return <BuildExercise data={ex.data as never} feedback={feedback} onResult={handleResult} />;
      case 'listen':
        return <ListenExercise data={ex.data as never} feedback={feedback} onResult={handleResult} />;
      case 'translate':
        return <TranslateExercise data={ex.data as never} feedback={feedback} onResult={handleResult} />;
      default:
        return <div className="p-8 text-center text-ink-light">{ex.exercise_type} — coming soon</div>;
    }
  };

  return (
    <>
      <div className="px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => {
            if (confirm('გაკვეთილის დასრულება? შენი პროგრესი დაიკარგება.')) router.push('/learn');
          }}
          className="text-ink-light"
        >
          <X size={24} />
        </button>
        <div className="flex-1 h-3 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">{renderExercise()}</div>

      <FeedbackBar feedback={feedback} onNext={handleNext} />
    </>
  );
}

function FeedbackBar({
  feedback,
  onNext
}: {
  feedback: 'correct' | 'wrong' | null;
  onNext: () => void;
}) {
  if (!feedback) return null;
  const isCorrect = feedback === 'correct';
  return (
    <div className={`p-5 ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
      <h3 className={`font-extrabold text-lg ${isCorrect ? 'text-primary-dark' : 'text-danger'}`}>
        {isCorrect ? '✓ ყოჩაღ!' : '✗ შეცდომაა'}
      </h3>
      <button onClick={onNext} className={`btn-primary w-full mt-3 ${isCorrect ? '' : 'bg-danger shadow-[0_4px_0_0_#C82323]'}`}>
        გაგრძელება
      </button>
    </div>
  );
}
