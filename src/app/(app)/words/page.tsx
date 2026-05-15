'use client';

import { useEffect, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { speak } from '@/lib/speech';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';

type Word = { en: string; ka: string; emoji: string };

export default function WordsPage() {
  const [words, setWords] = useState<Word[] | null>(null);
  const [query, setQuery] = useState('');

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
        unique.sort((a, b) => a.en.localeCompare(b.en));
        setWords(unique);
      });
  }, []);

  const filtered = words?.filter((w) => {
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return w.en.toLowerCase().includes(q) || w.ka.toLowerCase().includes(q);
  });

  return (
    <main className="px-5 py-6">
      <h1 className="text-2xl font-extrabold mb-1">
        <span aria-hidden="true">📚</span> ჩემი სიტყვები
      </h1>
      <p className="text-sm text-ink-light mb-4">
        {words === null ? 'იტვირთება...' : `${words.length} ნასწავლი სიტყვა`}
      </p>

      {words && words.length > 0 && (
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ძებნა — apple, ვაშლი..."
          aria-label="სიტყვების ძებნა"
          className="input mb-4"
        />
      )}

      {words === null && (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      )}

      {words?.length === 0 && (
        <EmptyState
          emoji="📭"
          title="ჯერ სიტყვები არ ისწავლე"
          description="დაიწყე გაკვეთილი და აქ გამოჩნდება ნასწავლი სიტყვები."
        />
      )}

      {filtered && filtered.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((w) => (
            <button
              key={w.en}
              onClick={() => speak(w.en)}
              aria-label={`${w.en} — ${w.ka}, მოუსმინე`}
              className="card flex flex-col items-center py-4 active:translate-y-[1px] transition-transform duration-75"
            >
              <div className="text-4xl mb-2" aria-hidden="true">{w.emoji}</div>
              <div className="font-bold text-base">{w.en}</div>
              <div className="text-xs text-ink-light mb-2">{w.ka}</div>
              <Volume2 size={14} className="text-secondary" />
            </button>
          ))}
        </div>
      )}

      {filtered && words && words.length > 0 && filtered.length === 0 && (
        <EmptyState emoji="🔎" title="ვერ ვიპოვე" description="სცადე სხვა საძიებო სიტყვა." />
      )}
    </main>
  );
}
