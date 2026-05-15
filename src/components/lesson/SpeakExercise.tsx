'use client';

import { useState } from 'react';
import { Mic, Volume2 } from 'lucide-react';
import { speak, listen } from '@/lib/speech';
import type { SpeakData } from '@/types/db';

export default function SpeakExercise({
  data,
  feedback,
  onResult
}: {
  data: SpeakData;
  feedback: 'correct' | 'wrong' | null;
  onResult: (correct: boolean) => void;
}) {
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState('');
  const [skipped, setSkipped] = useState(false);

  function handleMic() {
    if (listening || feedback) return;
    setListening(true);
    setHeard('');
    listen(data.target, (r) => {
      setListening(false);
      if (r.error === 'no-support') {
        setSkipped(true);
        return;
      }
      setHeard(r.heard || '');
      onResult(r.success);
    });
  }

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xl font-extrabold text-center mb-1">{data.prompt_ka}</h2>
      <p className="text-sm text-ink-light text-center mb-6">{data.prompt_en}</p>

      <div className="card flex flex-col items-center p-6 mb-6 bg-gradient-to-b from-white to-bg-soft">
        <button
          onClick={() => speak(data.target)}
          aria-label="მოუსმინე"
          className="bg-secondary text-white w-14 h-14 rounded-full flex items-center justify-center mb-4 shadow-[0_4px_0_0_#1899D6] active:translate-y-[2px] active:shadow-[0_2px_0_0_#1899D6] transition-all duration-75"
        >
          <Volume2 size={24} />
        </button>
        <div className="text-2xl font-extrabold mb-1">{data.target}</div>
        <div className="text-sm text-ink-light">{data.ka}</div>
      </div>

      <div className="flex flex-col items-center gap-4">
        <button
          onClick={handleMic}
          disabled={!!feedback}
          aria-label={listening ? 'ვუსმენ...' : 'დაჭირე და თქვი'}
          className={`w-24 h-24 rounded-full flex items-center justify-center text-white shadow-[0_6px_0_0_#C82323] active:translate-y-[3px] active:shadow-[0_3px_0_0_#C82323] transition-all duration-75 ${
            listening ? 'bg-primary animate-pulse' : 'bg-danger'
          }`}
        >
          <Mic size={36} />
        </button>
        <p className="text-sm font-bold text-ink-light min-h-[20px]" aria-live="polite">
          {listening ? 'ვუსმენ...' : heard ? `"${heard}"` : 'დაჭირე და თქვი'}
        </p>
      </div>

      {skipped && !feedback && (
        <button onClick={() => onResult(true)} className="btn-secondary mt-4">
          მიკროფონი არ მუშაობს — გამოტოვება
        </button>
      )}
    </div>
  );
}
