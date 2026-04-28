'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { addExercise, deleteExercise, updateLesson } from '@/app/admin/actions';

type LessonRow = {
  id: string;
  title_ka: string;
  title_en: string;
  emoji: string | null;
  xp_reward: number;
  is_published: boolean;
  units: { title_ka: string; worlds: { title_ka: string } | null } | null;
};

type ExerciseRow = {
  id: string;
  display_order: number;
  exercise_type: string;
  data: Record<string, unknown>;
};

const TYPE_OPTIONS = [
  { value: 'learn',     label: 'Learn (vocab card)' },
  { value: 'match',     label: 'Match (multiple choice)' },
  { value: 'speak',     label: 'Speak (pronounce phrase)' },
  { value: 'build',     label: 'Build (drag word bank)' },
  { value: 'translate', label: 'Translate (typed answer)' }
] as const;

type ExerciseType = (typeof TYPE_OPTIONS)[number]['value'];

export default function EditLessonClient({
  lesson,
  exercises
}: {
  lesson: LessonRow;
  exercises: ExerciseRow[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/lessons" className="text-sm text-secondary">
          ← All lessons
        </Link>
        <h1 className="text-xl font-extrabold mt-1">
          {lesson.emoji} {lesson.title_ka}
        </h1>
        <p className="text-xs text-ink-light">
          {lesson.units?.worlds?.title_ka} → {lesson.units?.title_ka} · {lesson.title_en}
        </p>
      </div>

      <LessonMetaForm lesson={lesson} />

      <section>
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink-light mb-3">
          Exercises ({exercises.length})
        </h2>
        <div className="space-y-2 mb-4">
          {exercises.length === 0 && (
            <p className="text-sm text-ink-light">No exercises yet — add one below.</p>
          )}
          {exercises.map((ex) => (
            <ExerciseRowDisplay key={ex.id} ex={ex} lessonId={lesson.id} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink-light mb-3">
          + Add exercise
        </h2>
        <AddExerciseForm lessonId={lesson.id} />
      </section>
    </div>
  );
}

function LessonMetaForm({ lesson }: { lesson: LessonRow }) {
  const [titleKa, setTitleKa] = useState(lesson.title_ka);
  const [titleEn, setTitleEn] = useState(lesson.title_en);
  const [emoji, setEmoji] = useState(lesson.emoji ?? '');
  const [xpReward, setXpReward] = useState(lesson.xp_reward);
  const [isPublished, setIsPublished] = useState(lesson.is_published);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateLesson(lesson.id, {
        title_ka: titleKa,
        title_en: titleEn,
        emoji,
        xp_reward: xpReward,
        is_published: isPublished
      });
      if (result.ok) setSavedAt(new Date().toLocaleTimeString());
    });
  }

  return (
    <form onSubmit={save} className="card space-y-3">
      <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink-light">
        Lesson details
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Title (KA)">
          <input
            value={titleKa}
            onChange={(e) => setTitleKa(e.target.value)}
            className="w-full border-2 border-border rounded-lg px-3 py-2"
          />
        </Field>
        <Field label="Title (EN)">
          <input
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
            className="w-full border-2 border-border rounded-lg px-3 py-2 text-center text-2xl"
          />
        </Field>
        <Field label="XP">
          <input
            type="number"
            min={1}
            max={100}
            value={xpReward}
            onChange={(e) => setXpReward(Number(e.target.value))}
            className="w-full border-2 border-border rounded-lg px-3 py-2"
          />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
        />
        Published
      </label>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? 'Saving...' : 'Save'}
        </button>
        {savedAt && <span className="text-xs text-ink-light">Saved {savedAt}</span>}
      </div>
    </form>
  );
}

function ExerciseRowDisplay({ ex, lessonId }: { ex: ExerciseRow; lessonId: string }) {
  const [isPending, startTransition] = useTransition();
  const summary = summarizeExercise(ex);
  return (
    <div className="card flex items-start justify-between gap-3 text-sm">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase text-secondary">{ex.exercise_type}</span>
          <span className="text-xs text-ink-lighter">#{ex.display_order}</span>
        </div>
        <div className="text-sm break-words">{summary}</div>
      </div>
      <button
        disabled={isPending}
        onClick={() => {
          if (!confirm('Delete this exercise?')) return;
          startTransition(() => {
            deleteExercise(ex.id, lessonId);
          });
        }}
        className="text-danger hover:text-danger-dark"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

function summarizeExercise(ex: ExerciseRow): string {
  const d = ex.data as Record<string, unknown>;
  switch (ex.exercise_type) {
    case 'learn':
      return `${d.emoji ?? ''} ${d.en ?? ''} → ${d.ka ?? ''}`;
    case 'match':
      return `${d.prompt_ka ?? ''} (correct: ${d.correct ?? ''})`;
    case 'speak':
      return `Say: ${d.target ?? ''} (${d.ka ?? ''})`;
    case 'build':
      return `Build: ${Array.isArray(d.target) ? (d.target as string[]).join(' ') : ''}`;
    case 'translate':
      return `${d.source_en ?? ''} → ${d.target_ka ?? ''}`;
    default:
      return JSON.stringify(d).slice(0, 80);
  }
}

function AddExerciseForm({ lessonId }: { lessonId: string }) {
  const [type, setType] = useState<ExerciseType>('learn');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [resetKey, setResetKey] = useState(0);

  function handleSubmit(data: Record<string, unknown>) {
    setError(null);
    startTransition(async () => {
      const result = await addExercise({ lesson_id: lessonId, exercise_type: type, data });
      if (result?.error) {
        setError(result.error);
        return;
      }
      setResetKey((k) => k + 1);
    });
  }

  return (
    <div className="card space-y-3">
      <Field label="Type">
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value as ExerciseType);
            setResetKey((k) => k + 1);
          }}
          className="w-full border-2 border-border rounded-lg px-3 py-2"
        >
          {TYPE_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </Field>

      {type === 'learn' && <LearnFields key={resetKey} onSubmit={handleSubmit} disabled={isPending} />}
      {type === 'match' && <MatchFields key={resetKey} onSubmit={handleSubmit} disabled={isPending} />}
      {type === 'speak' && <SpeakFields key={resetKey} onSubmit={handleSubmit} disabled={isPending} />}
      {type === 'build' && <BuildFields key={resetKey} onSubmit={handleSubmit} disabled={isPending} />}
      {type === 'translate' && (
        <TranslateFields key={resetKey} onSubmit={handleSubmit} disabled={isPending} />
      )}

      {error && <p className="text-danger text-xs">{error}</p>}
    </div>
  );
}

type SubFormProps = {
  onSubmit: (data: Record<string, unknown>) => void;
  disabled: boolean;
};

function LearnFields({ onSubmit, disabled }: SubFormProps) {
  const [emoji, setEmoji] = useState('');
  const [en, setEn] = useState('');
  const [ka, setKa] = useState('');
  return (
    <SubForm
      disabled={disabled}
      onSubmit={() => onSubmit({ emoji, en, ka, sound: en })}
    >
      <div className="grid grid-cols-[80px_1fr_1fr] gap-2">
        <input
          placeholder="🔤"
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          className="border-2 border-border rounded-lg px-3 py-2 text-center text-2xl"
        />
        <input
          required
          placeholder="English (e.g. Apple)"
          value={en}
          onChange={(e) => setEn(e.target.value)}
          className="border-2 border-border rounded-lg px-3 py-2"
        />
        <input
          required
          placeholder="Georgian (e.g. ვაშლი)"
          value={ka}
          onChange={(e) => setKa(e.target.value)}
          className="border-2 border-border rounded-lg px-3 py-2"
        />
      </div>
    </SubForm>
  );
}

function MatchFields({ onSubmit, disabled }: SubFormProps) {
  const [promptKa, setPromptKa] = useState('');
  const [promptEn, setPromptEn] = useState('');
  const [correct, setCorrect] = useState('');
  const [choices, setChoices] = useState([
    { en: '', ka: '', emoji: '' },
    { en: '', ka: '', emoji: '' },
    { en: '', ka: '', emoji: '' },
    { en: '', ka: '', emoji: '' }
  ]);
  return (
    <SubForm
      disabled={disabled}
      onSubmit={() =>
        onSubmit({
          prompt_en: promptEn,
          prompt_ka: promptKa,
          correct,
          choices: choices.filter((c) => c.en.trim())
        })
      }
    >
      <input
        required
        placeholder="Prompt (Georgian)"
        value={promptKa}
        onChange={(e) => setPromptKa(e.target.value)}
        className="w-full border-2 border-border rounded-lg px-3 py-2"
      />
      <input
        placeholder="Prompt (English)"
        value={promptEn}
        onChange={(e) => setPromptEn(e.target.value)}
        className="w-full border-2 border-border rounded-lg px-3 py-2"
      />
      <input
        required
        placeholder="Correct answer (must match a choice's English exactly)"
        value={correct}
        onChange={(e) => setCorrect(e.target.value)}
        className="w-full border-2 border-border rounded-lg px-3 py-2"
      />
      <div className="space-y-2">
        <div className="text-xs font-bold uppercase text-ink-light">Choices (4)</div>
        {choices.map((c, i) => (
          <div key={i} className="grid grid-cols-[60px_1fr_1fr] gap-2">
            <input
              placeholder="🔤"
              value={c.emoji}
              onChange={(e) => {
                const copy = [...choices];
                copy[i] = { ...copy[i], emoji: e.target.value };
                setChoices(copy);
              }}
              className="border-2 border-border rounded-lg px-2 py-2 text-center"
            />
            <input
              placeholder="English"
              value={c.en}
              onChange={(e) => {
                const copy = [...choices];
                copy[i] = { ...copy[i], en: e.target.value };
                setChoices(copy);
              }}
              className="border-2 border-border rounded-lg px-3 py-2"
            />
            <input
              placeholder="Georgian"
              value={c.ka}
              onChange={(e) => {
                const copy = [...choices];
                copy[i] = { ...copy[i], ka: e.target.value };
                setChoices(copy);
              }}
              className="border-2 border-border rounded-lg px-3 py-2"
            />
          </div>
        ))}
      </div>
    </SubForm>
  );
}

function SpeakFields({ onSubmit, disabled }: SubFormProps) {
  const [target, setTarget] = useState('');
  const [ka, setKa] = useState('');
  return (
    <SubForm
      disabled={disabled}
      onSubmit={() =>
        onSubmit({
          target,
          ka,
          prompt_en: `Say: ${target}`,
          prompt_ka: `თქვი: ${target}`
        })
      }
    >
      <input
        required
        placeholder="Target phrase (English) — e.g. Hello"
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        className="w-full border-2 border-border rounded-lg px-3 py-2"
      />
      <input
        required
        placeholder="Georgian translation"
        value={ka}
        onChange={(e) => setKa(e.target.value)}
        className="w-full border-2 border-border rounded-lg px-3 py-2"
      />
    </SubForm>
  );
}

function BuildFields({ onSubmit, disabled }: SubFormProps) {
  const [target, setTarget] = useState('');
  const [extras, setExtras] = useState('');
  const [ka, setKa] = useState('');
  return (
    <SubForm
      disabled={disabled}
      onSubmit={() => {
        const targetWords = target.split(/\s+/).filter(Boolean);
        const extraWords = extras.split(/\s+/).filter(Boolean);
        const bank = [...targetWords, ...extraWords].sort(() => Math.random() - 0.5);
        onSubmit({
          target: targetWords,
          bank,
          prompt_en: `Build: ${target}`,
          prompt_ka: `ააგე: ${ka}`,
          ka
        });
      }}
    >
      <input
        required
        placeholder="Target sentence (English) — e.g. Good morning"
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        className="w-full border-2 border-border rounded-lg px-3 py-2"
      />
      <input
        required
        placeholder="Georgian translation"
        value={ka}
        onChange={(e) => setKa(e.target.value)}
        className="w-full border-2 border-border rounded-lg px-3 py-2"
      />
      <input
        placeholder="Extra distractor words (space-separated, optional)"
        value={extras}
        onChange={(e) => setExtras(e.target.value)}
        className="w-full border-2 border-border rounded-lg px-3 py-2"
      />
    </SubForm>
  );
}

function TranslateFields({ onSubmit, disabled }: SubFormProps) {
  const [sourceEn, setSourceEn] = useState('');
  const [targetKa, setTargetKa] = useState('');
  const [acceptExtra, setAcceptExtra] = useState('');
  return (
    <SubForm
      disabled={disabled}
      onSubmit={() => {
        const accept = [
          targetKa,
          ...acceptExtra
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean)
        ];
        onSubmit({ source_en: sourceEn, target_ka: targetKa, accept });
      }}
    >
      <input
        required
        placeholder="Source (English) — e.g. My sister"
        value={sourceEn}
        onChange={(e) => setSourceEn(e.target.value)}
        className="w-full border-2 border-border rounded-lg px-3 py-2"
      />
      <input
        required
        placeholder="Target (Georgian) — e.g. ჩემი და"
        value={targetKa}
        onChange={(e) => setTargetKa(e.target.value)}
        className="w-full border-2 border-border rounded-lg px-3 py-2"
      />
      <textarea
        placeholder="Other accepted answers (one per line, optional)"
        value={acceptExtra}
        onChange={(e) => setAcceptExtra(e.target.value)}
        rows={2}
        className="w-full border-2 border-border rounded-lg px-3 py-2 font-mono text-xs"
      />
    </SubForm>
  );
}

function SubForm({
  onSubmit,
  disabled,
  children
}: {
  onSubmit: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-2"
    >
      {children}
      <button type="submit" disabled={disabled} className="btn-primary">
        {disabled ? 'Adding...' : 'Add exercise'}
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
