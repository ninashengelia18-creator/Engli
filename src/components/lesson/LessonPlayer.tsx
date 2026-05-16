'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, Heart } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Exercise } from '@/types/db';
import { track } from '@/lib/analytics';
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
  initialHearts: number;
  isPremium: boolean;
};

const STUCK_THRESHOLD = 3;

export default function LessonPlayer({
  lessonId,
  lessonTitle,
  exercises,
  xpReward,
  initialHearts,
  isPremium
}: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [idx, setIdx] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [done, setDone] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [hearts, setHearts] = useState(initialHearts);
  const [showQuit, setShowQuit] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [newAchievements, setNewAchievements] = useState<
    { slug: string; title_ka: string; emoji: string }[]
  >([]);
  const startedAt = useRef(Date.now());
  const attemptsByExercise = useRef<Record<string, number>>({});

  const ex = exercises[idx];
  const total = exercises.length;
  const progress = total === 0 ? 0 : (idx / total) * 100;
  const outOfHearts = !isPremium && hearts <= 0;

  useEffect(() => {
    track({ name: 'lesson_start', lesson_id: lessonId });
  }, [lessonId]);

  async function handleResult(correct: boolean) {
    if (!ex) return;
    setFeedback(correct ? 'correct' : 'wrong');

    if (!correct) {
      setMistakes((m) => m + 1);
      attemptsByExercise.current[ex.id] = (attemptsByExercise.current[ex.id] ?? 0) + 1;
      const attempts = attemptsByExercise.current[ex.id];
      if (attempts === STUCK_THRESHOLD) {
        track({ name: 'exercise_stuck', lesson_id: lessonId, exercise_id: ex.id, attempts });
      }
    }

    // Log attempt + decrement hearts (server-side via RPC). RLS scopes to auth.uid().
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from('exercise_attempts')
      .insert({ user_id: user.id, exercise_id: ex.id, is_correct: correct });

    if (!correct && !isPremium) {
      try {
        const { data } = await supabase.rpc('decrement_hearts');
        if (typeof data === 'number') setHearts(data);
        else setHearts((h) => Math.max(0, h - 1));
      } catch {
        setHearts((h) => Math.max(0, h - 1));
      }
    }
  }

  async function handleNext() {
    setFeedback(null);
    if (idx + 1 >= total) {
      setCompleting(true);
      setCompleteError(null);
      const seconds = Math.floor((Date.now() - startedAt.current) / 1000);
      try {
        const res = await fetch('/api/lesson/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lessonId, mistakes, seconds })
        });
        if (!res.ok) {
          const { error } = await res.json().catch(() => ({ error: 'Unknown' }));
          setCompleteError(error || 'შენახვა ვერ მოხერხდა');
        } else {
          track({ name: 'lesson_complete', lesson_id: lessonId, mistakes, seconds });
          try {
            const payload = (await res.json()) as {
              achievements?: { slug: string; title_ka: string; emoji: string }[];
            };
            if (payload.achievements && payload.achievements.length > 0) {
              setNewAchievements(payload.achievements);
            }
          } catch {
            // ignore: achievements display is optional
          }
        }
      } catch {
        setCompleteError('კავშირი ვერ მოხერხდა');
      }
      setCompleting(false);
      setDone(true);
    } else {
      setIdx(idx + 1);
    }
  }

  function handleQuit(confirmed: boolean) {
    if (!confirmed) {
      setShowQuit(false);
      return;
    }
    track({ name: 'lesson_abandon', lesson_id: lessonId, at_index: idx, total });
    router.push('/learn');
  }

  // Allow Enter to advance feedback bar
  useEffect(() => {
    if (!feedback) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') handleNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedback, idx]);

  if (done) {
    return (
      <LessonComplete
        xpEarned={xpReward}
        mistakes={mistakes}
        lessonTitle={lessonTitle}
        error={completeError}
        achievements={newAchievements}
      />
    );
  }

  if (outOfHearts) {
    return <OutOfHearts />;
  }

  if (!ex) return null;

  const renderExercise = () => {
    switch (ex.exercise_type) {
      case 'learn':
        return (
          <LearnExercise data={ex.data as never} feedback={feedback} onComplete={() => handleResult(true)} />
        );
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
        return (
          <div className="p-8 text-center text-ink-light">
            {ex.exercise_type} — coming soon
          </div>
        );
    }
  };

  return (
    <>
      <div className="px-4 py-3 flex items-center gap-3 border-b border-border/60">
        <button
          onClick={() => setShowQuit(true)}
          aria-label="გასვლა"
          className="text-ink-light hover:text-ink transition-colors p-1"
        >
          <X size={24} />
        </button>
        <div className="flex-1">
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={idx}
            aria-label={`გაკვეთილის პროგრესი: ${idx} ${total}-დან`}
            className="progress-track"
          >
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
        {!isPremium && (
          <div className="flex items-center gap-1 text-danger font-extrabold text-sm" aria-label={`${hearts} hearts`}>
            <Heart size={18} fill="currentColor" />
            <span className="tabular-nums">{hearts}</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">{renderExercise()}</div>

      <FeedbackBar feedback={feedback} onNext={handleNext} loading={completing} />

      {showQuit && <QuitModal onClose={(c) => handleQuit(c)} />}
    </>
  );
}

function FeedbackBar({
  feedback,
  onNext,
  loading
}: {
  feedback: 'correct' | 'wrong' | null;
  onNext: () => void;
  loading: boolean;
}) {
  if (!feedback) return null;
  const isCorrect = feedback === 'correct';
  return (
    <div
      role="status"
      aria-live="polite"
      className={`feedback-bar ${isCorrect ? 'feedback-bar-correct' : 'feedback-bar-wrong'}`}
    >
      <h3 className="font-extrabold text-lg flex items-center gap-2">
        <span aria-hidden="true">{isCorrect ? '✓' : '✗'}</span>
        {isCorrect ? 'ყოჩაღ!' : 'სცადე კიდევ'}
      </h3>
      <button
        onClick={onNext}
        disabled={loading}
        className={`mt-3 w-full ${isCorrect ? 'btn-primary' : 'btn-danger'} disabled:opacity-70`}
      >
        {loading ? '...' : 'გაგრძელება'}
      </button>
    </div>
  );
}

function QuitModal({ onClose }: { onClose: (confirmed: boolean) => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quit-title"
      className="fixed inset-0 bg-black/40 z-[60] flex items-end justify-center"
    >
      <div className="bg-white rounded-t-3xl w-full max-w-md p-6">
        <div className="text-center mb-5">
          <div className="text-5xl mb-3" aria-hidden="true">😢</div>
          <h2 id="quit-title" className="text-xl font-extrabold mb-1">
            ნამდვილად ხურავ?
          </h2>
          <p className="text-sm text-ink-light">პროგრესი არ შენახდება</p>
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={() => onClose(false)} className="btn-primary">
            გავაგრძელო სწავლა
          </button>
          <button onClick={() => onClose(true)} className="btn-ghost py-3">
            დახურვა
          </button>
        </div>
      </div>
    </div>
  );
}

function OutOfHearts() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-10">
      <div className="text-7xl mb-3" aria-hidden="true">❤️‍🩹</div>
      <h2 className="text-xl font-extrabold mb-2">გული გათავდა!</h2>
      <p className="text-sm text-ink-light mb-6 max-w-xs">
        გული ავტომატურად დაგიბრუნდება. ან გადადი Premium-ზე და უსასრულო გული გექნება.
      </p>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        <a href="/upgrade" className="btn-accent text-center">
          გახსენი Premium
        </a>
        <a href="/learn" className="btn-secondary text-center">
          დაბრუნება
        </a>
      </div>
    </div>
  );
}
