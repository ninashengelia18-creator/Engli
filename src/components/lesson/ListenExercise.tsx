'use client';

import { useState, useEffect } from 'react';
import { Volume2 } from 'lucide-react';
import { speak } from '@/lib/speech';
import type { ListenData } from '@/types/db';

export default function ListenExercise({
  data,
  feedback,
  onResult
}: {
  data: ListenData;
  feedback: 'correct' | 'wrong' | null;
  onResult: (correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => speak(data.correct), 400);
    return () => clearTimeout(t);
  }, [data.correct]);

  function handleCheck() {
    if (!selected) return;
    onResult(selected === data.correct);
  }

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xl font-extrabold text-center mb-2">{data.prompt_ka}</h2>
      <p className="text-sm text-ink-light text-center mb-6">{data.prompt_en}</p>

      <div className="flex justify-center mb-6">
        <button
          onClick={() => speak(data.correct)}
          aria-label="მოუსმინე ხელახლა"
          className="bg-secondary text-white w-20 h-20 rounded-full flex items-center justify-center shadow-[0_4px_0_0_#1899D6] active:translate-y-[2px] active:shadow-[0_2px_0_0_#1899D6] transition-all duration-75"
        >
          <Volume2 size={32} />
        </button>
      </div>

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
              onClick={() => setSelected(c.en)}
              className={`${tileClass} min-h-[90px] flex flex-col items-center justify-center gap-1`}
            >
              {c.emoji && <div className="text-2xl" aria-hidden="true">{c.emoji}</div>}
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
