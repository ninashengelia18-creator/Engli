'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createWorld } from '@/app/admin/actions';
import { AdminField } from '@/components/admin/AdminField';

export default function NewWorldForm() {
  const router = useRouter();
  const [slug, setSlug] = useState('');
  const [titleKa, setTitleKa] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [descKa, setDescKa] = useState('');
  const [descEn, setDescEn] = useState('');
  const [emoji, setEmoji] = useState('🌱');
  const [color, setColor] = useState('#58CC02');
  const [isPremium, setIsPremium] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createWorld({
        slug,
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
      router.push(`/admin/worlds/${result.data!.id}/edit`);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3 max-w-md">
      <AdminField label="Slug (e.g. intermediate, advanced)">
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
      <div className="grid grid-cols-2 gap-3">
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
      </div>
      <div className="grid grid-cols-[80px_120px_1fr] gap-3">
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
      <div className="flex flex-col gap-2 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={isPremium} onChange={(e) => setIsPremium(e.target.checked)} />
          Premium (locked for free users)
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
          Published (visible to learners)
        </label>
      </div>

      {error && <p className="text-danger text-sm">{error}</p>}
      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? 'Creating…' : 'Create world'}
      </button>
    </form>
  );
}
