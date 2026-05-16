'use client';

import { useState, useTransition } from 'react';
import { updateWorld } from '@/app/admin/actions';
import { AdminField } from '@/components/admin/AdminField';

type WorldRow = {
  id: string;
  title_en: string;
  title_ka: string;
  description_en: string | null;
  description_ka: string | null;
  emoji: string | null;
  color: string | null;
  is_premium: boolean;
  is_published: boolean;
};

export default function EditWorldClient({ world }: { world: WorldRow }) {
  const [titleKa, setTitleKa] = useState(world.title_ka);
  const [titleEn, setTitleEn] = useState(world.title_en);
  const [descKa, setDescKa] = useState(world.description_ka ?? '');
  const [descEn, setDescEn] = useState(world.description_en ?? '');
  const [emoji, setEmoji] = useState(world.emoji ?? '🌱');
  const [color, setColor] = useState(world.color ?? '#58CC02');
  const [isPremium, setIsPremium] = useState(world.is_premium);
  const [isPublished, setIsPublished] = useState(world.is_published);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateWorld(world.id, {
        title_ka: titleKa,
        title_en: titleEn,
        description_ka: descKa,
        description_en: descEn,
        emoji,
        color,
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
        World details
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
        <AdminField label="Description (Georgian)">
          <input
            value={descKa}
            onChange={(e) => setDescKa(e.target.value)}
            className="w-full border-2 border-border rounded-lg px-3 py-2"
          />
        </AdminField>
        <AdminField label="Description (English)">
          <input
            value={descEn}
            onChange={(e) => setDescEn(e.target.value)}
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
        <AdminField label="Color">
          <input
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full border-2 border-border rounded-lg px-3 py-2 font-mono text-sm"
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
