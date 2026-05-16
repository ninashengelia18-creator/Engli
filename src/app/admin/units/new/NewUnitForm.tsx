'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createUnit } from '@/app/admin/actions';
import { AdminField } from '@/components/admin/AdminField';

type WorldOption = { id: string; title_ka: string; title_en: string };

export default function NewUnitForm({
  worlds,
  defaultWorldId
}: {
  worlds: WorldOption[];
  defaultWorldId?: string;
}) {
  const router = useRouter();
  const [worldId, setWorldId] = useState(defaultWorldId || worlds[0]?.id || '');
  const [slug, setSlug] = useState('');
  const [titleKa, setTitleKa] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [emoji, setEmoji] = useState('📚');
  const [isPremium, setIsPremium] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createUnit({
        world_id: worldId,
        slug,
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
      router.push(`/admin/units/${result.data!.id}/edit`);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3 max-w-md">
      <AdminField label="World">
        <select
          required
          value={worldId}
          onChange={(e) => setWorldId(e.target.value)}
          className="w-full border-2 border-border rounded-lg px-3 py-2"
        >
          {worlds.map((w) => (
            <option key={w.id} value={w.id}>
              {w.title_ka} ({w.title_en})
            </option>
          ))}
        </select>
      </AdminField>
      <AdminField label="Slug (e.g. food-and-drink)">
        <input
          required
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
          className="w-full border-2 border-border rounded-lg px-3 py-2"
        />
      </AdminField>
      <div className="grid grid-cols-2 gap-3">
        <AdminField label="Title (Georgian)">
          <input
            required
            value={titleKa}
            onChange={(e) => setTitleKa(e.target.value)}
            className="w-full border-2 border-border rounded-lg px-3 py-2"
          />
        </AdminField>
        <AdminField label="Title (English)">
          <input
            required
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            className="w-full border-2 border-border rounded-lg px-3 py-2"
          />
        </AdminField>
      </div>
      <AdminField label="Emoji">
        <input
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          maxLength={4}
          className="w-20 border-2 border-border rounded-lg px-3 py-2 text-center text-2xl"
        />
      </AdminField>
      <div className="flex flex-col gap-1 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={isPremium} onChange={(e) => setIsPremium(e.target.checked)} />
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
      {error && <p className="text-danger text-sm">{error}</p>}
      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? 'Creating…' : 'Create unit'}
      </button>
    </form>
  );
}
