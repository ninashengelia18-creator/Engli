'use client';

import { useEffect, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { speak } from '@/lib/speech';

type Word = { en: string; ka: string; emoji: string };

export default function WordsPage() {
  const [words, setWords] = useState<Word[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('exercises')
      .select('data')
      .eq('exercise_type', 'learn')
      .then(({ data }) => {
        const seen = new Set<string>();
        const unique: Word[] = [];
        (data ?? []).forEach((row: { data: Word }) => {
          if (row.data?.en && !seen.has(row.data.en)) {
            seen.add(row.data.en);
            unique.push(row.data);
          }
        });
        setWords(unique);
      });
  }, []);

  return (
    <main className="px-5 py-6">
      <h1 className="text-2xl font-extrabold mb-1">📚 ჩემი სიტყვები</h1>
      <p className="text-sm text-ink-light mb-6">{words.length} ნასწავლი სიტყვა</p>

      <div className="grid grid-cols-2 gap-3">
        {words.map((w) => (
          <button
            key={w.en}
            onClick={() => speak(w.en)}
            className="card flex flex-col items-center py-4"
          >
            <div className="text-4xl mb-2">{w.emoji}</div>
            <div className="font-bold text-base">{w.en}</div>
            <div className="text-xs text-ink-light mb-2">{w.ka}</div>
            <Volume2 size={14} className="text-secondary" />
          </button>
        ))}
      </div>
    </main>
  );
}
