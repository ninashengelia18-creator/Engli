'use client';

import { useEffect } from 'react';
import { Volume2 } from 'lucide-react';
import { speak } from '@/lib/speech';
import type { LearnData } from '@/types/db';

export default function LearnExercise({
  data,
  feedback,
  onComplete
}: {
  data: LearnData;
  feedback: 'correct' | 'wrong' | null;
  onComplete: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(() => speak(data.sound), 400);
    return () => clearTimeout(t);
  }, [data.sound]);

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xl font-extrabold text-center mb-2">ახალი სიტყვა</h2>
      <p className="text-sm text-ink-light text-center mb-6">მოუსმინე და გაიმეორე</p>

      <div className="card flex-1 flex flex-col items-center justify-center p-8">
        <div className="text-7xl mb-4">{data.emoji}</div>
        <div className="text-3xl font-extrabold mb-1">{data.en}</div>
        <div className="text-base text-ink-light mb-6">{data.ka}</div>
        <button
          onClick={() => speak(data.sound)}
          className="bg-secondary text-white w-16 h-16 rounded-full flex items-center justify-center shadow-[0_4px_0_0_#1899D6] active:translate-y-[2px] active:shadow-[0_2px_0_0_#1899D6]"
        >
          <Volume2 size={28} />
        </button>
      </div>

      {!feedback && (
        <button onClick={onComplete} className="btn-primary mt-4 w-full">
          გავიგე
        </button>
      )}
    </div>
  );
}
