'use client';

import { useState } from 'react';
import { speak } from '@/lib/speech';
import type { MatchData } from '@/types/db';

export default function MatchExercise({
  data,
  feedback,
  onResult
}: {
  data: MatchData;
  feedback: 'correct' | 'wrong' | null;
  onResult: (correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  function handleCheck() {
    if (!selected) return;
    onResult(selected === data.correct);
  }

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xl font-extrabold text-center mb-1">{data.prompt_ka}</h2>
      <p className="text-sm text-ink-light text-center mb-6">{data.prompt_en}</p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {data.choices.map((c) => {
          const isSelected = selected === c.en;
          const showCorrect = feedback && c.en === data.correct;
          const showWrong = feedback === 'wrong' && isSelected;
          return (
            <button
              key={c.en}
              disabled={!!feedback}
              onClick={() => {
                setSelected(c.en);
                speak(c.en);
              }}
              className={`p-4 rounded-2xl border-2 border-b-4 transition-all min-h-[110px] flex flex-col items-center justify-center gap-2 ${
                showCorrect
                  ? 'bg-green-100 border-primary text-primary-dark'
                  : showWrong
                    ? 'bg-red-100 border-danger text-danger'
                    : isSelected
                      ? 'bg-blue-50 border-secondary text-secondary'
                      : 'bg-white border-border'
              }`}
            >
              {c.emoji && <div className="text-3xl">{c.emoji}</div>}
              <div className="font-bold">{c.en}</div>
              <div className="text-xs text-ink-light">{c.ka}</div>
            </button>
          );
        })}
      </div>

      {!feedback && (
        <button onClick={handleCheck} disabled={!selected} className="btn-primary w-full mt-auto">
          შემოწმება
        </button>
      )}
    </div>
  );
}
