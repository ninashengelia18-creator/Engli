'use client';

import { useState, useTransition } from 'react';
import { createLesson } from '@/app/admin/actions';

type UnitOption = {
  id: string;
  title_ka: string;
  title_en: string;
  worlds: { title_ka: string } | { title_ka: string }[] | null;
};

export default function NewLessonForm({ units }: { units: UnitOption[] }) {
  const [unitId, setUnitId] = useState(units[0]?.id ?? '');
  const [slug, setSlug] = useState('');
  const [titleKa, setTitleKa] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [emoji, setEmoji] = useState('📘');
  const [xpReward, setXpReward] = useState(10);
  const [isPublished, setIsPublished] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createLesson({
        unit_id: unitId,
        slug: slug.trim(),
        title_en: titleEn.trim(),
        title_ka: titleKa.trim(),
        emoji: emoji.trim() || '📘',
        xp_reward: xpReward,
        is_published: isPublished
      });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3 max-w-md">
      <Field label="Unit">
        <select
          required
          value={unitId}
          onChange={(e) => setUnitId(e.target.value)}
          className="w-full border-2 border-border rounded-lg px-3 py-2"
        >
          {units.map((u) => {
            const world = Array.isArray(u.worlds) ? u.worlds[0] : u.worlds;
            return (
              <option key={u.id} value={u.id}>
                {world?.title_ka ?? '?'} → {u.title_ka} ({u.title_en})
              </option>
            );
          })}
        </select>
      </Field>

      <Field label="Slug (lowercase, dash-separated)">
        <input
          required
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
          placeholder="e.g. food-and-drink"
          className="w-full border-2 border-border rounded-lg px-3 py-2"
        />
      </Field>

      <Field label="Title (Georgian)">
        <input
          required
          value={titleKa}
          onChange={(e) => setTitleKa(e.target.value)}
          className="w-full border-2 border-border rounded-lg px-3 py-2"
        />
      </Field>

      <Field label="Title (English)">
        <input
          required
          value={titleEn}
          onChange={(e) => setTitleEn(e.target.value)}
          className="w-full border-2 border-border rounded-lg px-3 py-2"
        />
      </Field>

      <Field label="Emoji">
        <input
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          maxLength={4}
          className="w-20 border-2 border-border rounded-lg px-3 py-2 text-center text-2xl"
        />
      </Field>

      <Field label="XP reward">
        <input
          type="number"
          min={1}
          max={100}
          value={xpReward}
          onChange={(e) => setXpReward(Number(e.target.value))}
          className="w-24 border-2 border-border rounded-lg px-3 py-2"
        />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
        />
        Published (visible to learners)
      </label>

      {error && <p className="text-danger text-sm">{error}</p>}

      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? 'Creating...' : 'Create lesson'}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-ink-light mb-1 uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  );
}
