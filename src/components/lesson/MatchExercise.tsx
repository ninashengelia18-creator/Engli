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

      <div role="radiogroup" aria-label={data.prompt_ka} className="grid grid-cols-2 gap-3 mb-4">
        {data.choices.map((c) => {
          const isSelected = selected === c.en;
          const showCorrect = feedback && c.en === data.correct;
          const showWrong = feedback === 'wrong' && isSelected;
          const tileClass = showCorrect
            ? 'tile tile-correct'
            : showWrong
              ? 'tile tile-wrong'
              : isSelected
                ? 'tile tile-selected'
                : 'tile';
          return (
            <button
              key={c.en}
              role="radio"
              aria-checked={isSelected}
              disabled={!!feedback}
              onClick={() => {
                setSelected(c.en);
                speak(c.en);
              }}
              className={`${tileClass} min-h-[110px] flex flex-col items-center justify-center gap-2`}
            >
              {c.emoji && <div className="text-3xl" aria-hidden="true">{c.emoji}</div>}
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
