'use client';

import { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { speak } from '@/lib/speech';
import type { TranslateData } from '@/types/db';

export default function TranslateExercise({
  data,
  feedback,
  onResult
}: {
  data: TranslateData;
  feedback: 'correct' | 'wrong' | null;
  onResult: (correct: boolean) => void;
}) {
  const [answer, setAnswer] = useState('');

  function normalize(s: string) {
    return s.toLowerCase().trim().replace(/[.,!?]/g, '').replace(/\s+/g, ' ');
  }

  function handleCheck() {
    const userNorm = normalize(answer);
    const allAccepted = [data.target_ka, ...data.accept].map(normalize);
    onResult(allAccepted.includes(userNorm));
  }

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xl font-extrabold text-center mb-1">თარგმნე ქართულად</h2>
      <p className="text-sm text-ink-light text-center mb-6">Translate to Georgian</p>

      <div className="card flex items-center gap-3 mb-4 p-4 bg-bg-soft">
        <button
          onClick={() => speak(data.source_en)}
          aria-label="მოუსმინე"
          className="text-secondary hover:text-secondary-dark transition-colors"
        >
          <Volume2 size={22} />
        </button>
        <div className="font-extrabold text-lg leading-tight">{data.source_en}</div>
      </div>

      <label htmlFor="translate-input" className="sr-only">
        პასუხი
      </label>
      <textarea
        id="translate-input"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        disabled={!!feedback}
        placeholder="დაწერე ქართულად..."
        rows={3}
        className="input min-h-[100px] resize-none"
      />

      {feedback === 'wrong' && (
        <p className="text-sm text-ink-light mt-3">
          სწორი პასუხი: <strong className="text-primary-dark">{data.target_ka}</strong>
        </p>
      )}

      {!feedback && (
        <button
          onClick={handleCheck}
          disabled={!answer.trim()}
          className="btn-primary w-full mt-auto"
        >
          შემოწმება
        </button>
      )}
    </div>
  );
}
