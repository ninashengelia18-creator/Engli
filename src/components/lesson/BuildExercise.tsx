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
      <h2 className="text-xl font-extrabold text-center mb-2">ააგე წინადადება</h2>
      <p className="text-sm text-ink-light text-center mb-6">{data.ka}</p>

      <div className="min-h-[80px] border-b-2 border-border mb-4 p-2 flex flex-wrap gap-2">
        {built.map((b, i) => (
          <button
            key={i}
            onClick={() => removeWord(i)}
            className="bg-white border-2 border-border border-b-4 rounded-xl px-3 py-2 font-bold"
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
              className={`bg-white border-2 border-border border-b-4 rounded-xl px-3 py-2 font-bold ${
                used ? 'invisible' : ''
              }`}
            >
              {w}
            </button>
          );
        })}
      </div>

      {!feedback && (
        <button
          onClick={handleCheck}
          disabled={built.length !== data.target.length}
          className="btn-primary mt-auto"
        >
          შემოწმება
        </button>
      )}
    </div>
  );
}
