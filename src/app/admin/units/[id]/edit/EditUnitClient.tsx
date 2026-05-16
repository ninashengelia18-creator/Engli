'use client';

import { useState, useTransition } from 'react';
import { updateUnit } from '@/app/admin/actions';
import { AdminField } from '@/components/admin/AdminField';

type UnitRow = {
  id: string;
  title_en: string;
  title_ka: string;
  emoji: string | null;
  is_premium: boolean;
  is_published: boolean;
};

export default function EditUnitClient({ unit }: { unit: UnitRow }) {
  const [titleKa, setTitleKa] = useState(unit.title_ka);
  const [titleEn, setTitleEn] = useState(unit.title_en);
  const [emoji, setEmoji] = useState(unit.emoji ?? '📚');
  const [isPremium, setIsPremium] = useState(unit.is_premium);
  const [isPublished, setIsPublished] = useState(unit.is_published);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateUnit(unit.id, {
        title_ka: titleKa,
        title_en: titleEn,
        emoji,
        is_premium: isPremium,
        is_published: isPublished
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSavedAt(new Date().toLocaleTimeString());
    });
  }

  return (
    <form onSubmit={save} className="card space-y-3">
      <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink-light">
        Unit details
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <AdminField label="Title (Georgian)">
          <input
            value={titleKa}
            onChange={(e) => setTitleKa(e.target.value)}
            className="w-full border-2 border-border rounded-lg px-3 py-2"
          />
        </AdminField>
        <AdminField label="Title (English)">
          <input
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            className="w-full border-2 border-border rounded-lg px-3 py-2"
          />
        </AdminField>
        <AdminField label="Emoji">
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            maxLength={4}
            className="w-full border-2 border-border rounded-lg px-3 py-2 text-center text-2xl"
          />
        </AdminField>
      </div>
      <div className="flex flex-col gap-1 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isPremium}
            onChange={(e) => setIsPremium(e.target.checked)}
          />
          Premium
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
          Published
        </label>
      </div>
      {error && <p className="text-danger text-xs">{error}</p>}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? 'Saving…' : 'Save'}
        </button>
        {savedAt && <span className="text-xs text-ink-light">Saved {savedAt}</span>}
      </div>
    </form>
  );
}
