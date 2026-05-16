'use client';

import { useState } from 'react';
import type { BuildData } from '@/types/db';

export default function BuildExercise({
  data,
  feedback,
  onResult
}: {
  data: BuildData;
  feedback: 'correct' | 'wrong' | null;
  onResult: (correct: boolean) => void;
}) {
  const [built, setBuilt] = useState<{ word: string; bankIdx: number }[]>([]);

  function addWord(word: string, bankIdx: number) {
    if (feedback) return;
    if (built.some((b) => b.bankIdx === bankIdx)) return;
    setBuilt([...built, { word, bankIdx }]);
  }

  function removeWord(i: number) {
    if (feedback) return;
    setBuilt(built.filter((_, idx) => idx !== i));
  }

  function handleCheck() {
    const built_str = built.map((b) => b.word).join(' ');
    const target_str = data.target.join(' ');
    onResult(built_str === target_str);
  }

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xl font-extrabold text-center mb-1">ააგე წინადადება</h2>
      <p className="text-sm text-ink-light text-center mb-6">{data.ka}</p>

      <div
        aria-label="აგებული წინადადება"
        className={`min-h-[88px] rounded-xl border-2 border-dashed mb-3 p-3 flex flex-wrap gap-2 transition-colors ${
          built.length === 0 ? 'border-border bg-bg-soft' : 'border-border bg-white'
        }`}
      >
        {built.length === 0 && (
          <span className="text-xs text-ink-lighter font-semibold self-center mx-auto">
            დააჭირე სიტყვებს
          </span>
        )}
        {built.map((b, i) => (
          <button
            key={i}
            onClick={() => removeWord(i)}
            aria-label={`წაშალე ${b.word}`}
            className="bg-white border-2 border-border border-b-4 rounded-xl px-3 py-2 font-bold active:translate-y-[2px] active:border-b-2 transition-all duration-75"
          >
            {b.word}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {data.bank.map((w, i) => {
          const used = built.some((b) => b.bankIdx === i);
          return (
            <button
              key={i}
              onClick={() => addWord(w, i)}
              disabled={used || !!feedback}
              className={`bg-white border-2 border-border border-b-4 rounded-xl px-3 py-2 font-bold active:translate-y-[2px] active:border-b-2 transition-all duration-75 ${
                used ? 'opacity-0 pointer-events-none' : ''
              }`}
            >
              {w}
            </button>
          );
        })}
      </div>

      {feedback === 'wrong' && (
        <p className="text-sm text-ink-light mb-3 text-center">
          სწორი პასუხი:{' '}
          <strong className="text-primary-dark">{data.target.join(' ')}</strong>
        </p>
      )}

      {!feedback && (
        <button
          onClick={handleCheck}
          disabled={built.length !== data.target.length}
          className="btn-primary mt-auto w-full"
        >
          შემოწმება
        </button>
      )}
    </div>
  );
}
