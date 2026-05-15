'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import {
  addExercise,
  deleteExercise,
  reorderExercise,
  updateLesson
} from '@/app/admin/actions';
import { AdminField } from '@/components/admin/AdminField';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';

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
  { value: 'listen',    label: 'Listen (audio + choices)' },
  { value: 'speak',     label: 'Speak (pronounce phrase)' },
  { value: 'build',     label: 'Build (drag word bank)' },
  { value: 'translate', label: 'Translate (typed answer)' },
  { value: 'story',     label: 'Story (scenes + questions)' }
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
          {exercises.map((ex, i) => (
            <ExerciseRowDisplay
              key={ex.id}
              ex={ex}
              lessonId={lesson.id}
              canMoveUp={i > 0}
              canMoveDown={i < exercises.length - 1}
            />
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
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateLesson(lesson.id, {
        title_ka: titleKa,
        title_en: titleEn,
        emoji,
        xp_reward: xpReward,
        is_published: isPublished
      });
      if ('error' in result && result.error) {
        setError(result.error);
        return;
      }
      setSavedAt(new Date().toLocaleTimeString());
    });
  }

  return (
    <form onSubmit={save} className="card space-y-3">
      <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink-light">
        Lesson details
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <AdminField label="Title (KA)">
          <input
            value={titleKa}
            onChange={(e) => setTitleKa(e.target.value)}
            className="w-full border-2 border-border rounded-lg px-3 py-2"
          />
        </AdminField>
        <AdminField label="Title (EN)">
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
        <AdminField label="XP">
          <input
            type="number"
            min={1}
            max={200}
            value={xpReward}
            onChange={(e) => setXpReward(Number(e.target.value))}
            className="w-full border-2 border-border rounded-lg px-3 py-2"
          />
        </AdminField>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
        />
        Published
      </label>
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

function ExerciseRowDisplay({
  ex,
  lessonId,
  canMoveUp,
  canMoveDown
}: {
  ex: ExerciseRow;
  lessonId: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
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
      <div className="flex items-center gap-1 shrink-0">
        <button
          aria-label="Move up"
          disabled={!canMoveUp || isPending}
          onClick={() =>
            startTransition(() => {
              void reorderExercise(ex.id, lessonId, 'up');
            })
          }
          className="p-1 text-ink-light hover:text-ink disabled:opacity-30"
        >
          <ArrowUp size={16} />
        </button>
        <button
          aria-label="Move down"
          disabled={!canMoveDown || isPending}
          onClick={() =>
            startTransition(() => {
              void reorderExercise(ex.id, lessonId, 'down');
            })
          }
          className="p-1 text-ink-light hover:text-ink disabled:opacity-30"
        >
          <ArrowDown size={16} />
        </button>
        <button
          aria-label="Delete"
          disabled={isPending}
          onClick={() => setConfirming(true)}
          className="p-1 text-danger hover:text-danger-dark"
        >
          <Trash2 size={16} />
        </button>
      </div>
      {confirming && (
        <ConfirmDialog
          title="Delete this exercise?"
          body="This cannot be undone."
          confirmLabel="Delete"
          onConfirm={() => {
            setConfirming(false);
            startTransition(() => {
              void deleteExercise(ex.id, lessonId);
            });
          }}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  );
}

function summarizeExercise(ex: ExerciseRow): string {
  const d = ex.data as Record<string, unknown>;
  switch (ex.exercise_type) {
    case 'learn':
      return `${d.emoji ?? ''} ${d.en ?? ''} → ${d.ka ?? ''}`;
    case 'match':
    case 'listen':
      return `${d.prompt_ka ?? ''} (correct: ${d.correct ?? ''})`;
    case 'speak':
      return `Say: ${d.target ?? ''} (${d.ka ?? ''})`;
    case 'build':
      return `Build: ${Array.isArray(d.target) ? (d.target as string[]).join(' ') : ''}`;
    case 'translate':
      return `${d.source_en ?? ''} → ${d.target_ka ?? ''}`;
    case 'story': {
      const scenes = Array.isArray(d.scenes) ? (d.scenes as { en?: string }[]) : [];
      return `Story (${scenes.length} scenes): ${scenes[0]?.en ?? ''}…`;
    }
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
      <AdminField label="Type">
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value as ExerciseType);
            setResetKey((k) => k + 1);
            setError(null);
          }}
          className="w-full border-2 border-border rounded-lg px-3 py-2"
        >
          {TYPE_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </AdminField>

      {type === 'learn' && <LearnFields key={resetKey} onSubmit={handleSubmit} disabled={isPending} />}
      {type === 'match' && <MatchFields key={resetKey} onSubmit={handleSubmit} disabled={isPending} />}
      {type === 'listen' && <ListenFields key={resetKey} onSubmit={handleSubmit} disabled={isPending} />}
      {type === 'speak' && <SpeakFields key={resetKey} onSubmit={handleSubmit} disabled={isPending} />}
      {type === 'build' && <BuildFields key={resetKey} onSubmit={handleSubmit} disabled={isPending} />}
      {type === 'translate' && (
        <TranslateFields key={resetKey} onSubmit={handleSubmit} disabled={isPending} />
      )}
      {type === 'story' && <StoryFields key={resetKey} onSubmit={handleSubmit} disabled={isPending} />}

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
  return <MatchOrListenFields kind="match" onSubmit={onSubmit} disabled={disabled} />;
}
function ListenFields({ onSubmit, disabled }: SubFormProps) {
  return <MatchOrListenFields kind="listen" onSubmit={onSubmit} disabled={disabled} />;
}

function MatchOrListenFields({
  kind,
  onSubmit,
  disabled
}: SubFormProps & { kind: 'match' | 'listen' }) {
  const [promptKa, setPromptKa] = useState('');
  const [promptEn, setPromptEn] = useState('');
  const [correct, setCorrect] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
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
          audio_url: kind === 'listen' ? audioUrl : undefined,
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
      {kind === 'listen' && (
        <input
          placeholder="Audio URL (optional — TTS used if blank)"
          value={audioUrl}
          onChange={(e) => setAudioUrl(e.target.value)}
          className="w-full border-2 border-border rounded-lg px-3 py-2 text-xs font-mono"
        />
      )}
      <input
        required
        placeholder="Correct answer (must match a choice's English exactly)"
        value={correct}
        onChange={(e) => setCorrect(e.target.value)}
        className="w-full border-2 border-border rounded-lg px-3 py-2"
      />
      <div className="space-y-2">
        <div className="text-xs font-bold uppercase text-ink-light">Choices (up to 4)</div>
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
        onSubmit({
          target: targetWords,
          bank: [...targetWords, ...extraWords],
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
        const accept = acceptExtra
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean);
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

function StoryFields({ onSubmit, disabled }: SubFormProps) {
  const [scenes, setScenes] = useState([
    { image: '📖', en: '', ka: '' },
    { image: '🌟', en: '', ka: '' }
  ]);
  const [question, setQuestion] = useState({ en: '', ka: '', correct: '', choicesText: '' });

  function addScene() {
    setScenes((s) => [...s, { image: '✨', en: '', ka: '' }]);
  }
  function setScene(i: number, patch: Partial<{ image: string; en: string; ka: string }>) {
    setScenes((s) => s.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }
  function removeScene(i: number) {
    setScenes((s) => s.filter((_, idx) => idx !== i));
  }

  return (
    <SubForm
      disabled={disabled}
      onSubmit={() => {
        const choices = question.choicesText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean);
        const questions = question.en && question.correct ? [{ ...question, choices }] : [];
        onSubmit({ scenes, questions });
      }}
    >
      <div className="space-y-2">
        <div className="text-xs font-bold uppercase text-ink-light">Scenes</div>
        {scenes.map((sc, i) => (
          <div key={i} className="grid grid-cols-[60px_1fr_1fr_30px] gap-2 items-center">
            <input
              value={sc.image}
              onChange={(e) => setScene(i, { image: e.target.value })}
              className="border-2 border-border rounded-lg px-2 py-2 text-center text-xl"
            />
            <input
              placeholder="English line"
              value={sc.en}
              onChange={(e) => setScene(i, { en: e.target.value })}
              className="border-2 border-border rounded-lg px-3 py-2"
            />
            <input
              placeholder="Georgian line"
              value={sc.ka}
              onChange={(e) => setScene(i, { ka: e.target.value })}
              className="border-2 border-border rounded-lg px-3 py-2"
            />
            <button
              type="button"
              onClick={() => removeScene(i)}
              className="text-danger text-lg"
              aria-label="Remove scene"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addScene}
          className="text-xs font-bold text-secondary"
        >
          + Add scene
        </button>
      </div>
      <div className="space-y-2">
        <div className="text-xs font-bold uppercase text-ink-light">
          Comprehension question (optional)
        </div>
        <input
          placeholder="Question (English)"
          value={question.en}
          onChange={(e) => setQuestion({ ...question, en: e.target.value })}
          className="w-full border-2 border-border rounded-lg px-3 py-2"
        />
        <input
          placeholder="Question (Georgian)"
          value={question.ka}
          onChange={(e) => setQuestion({ ...question, ka: e.target.value })}
          className="w-full border-2 border-border rounded-lg px-3 py-2"
        />
        <input
          placeholder="Correct answer"
          value={question.correct}
          onChange={(e) => setQuestion({ ...question, correct: e.target.value })}
          className="w-full border-2 border-border rounded-lg px-3 py-2"
        />
        <textarea
          placeholder="Choices (one per line, include the correct one)"
          value={question.choicesText}
          onChange={(e) => setQuestion({ ...question, choicesText: e.target.value })}
          rows={3}
          className="w-full border-2 border-border rounded-lg px-3 py-2 font-mono text-xs"
        />
      </div>
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
        {disabled ? 'Adding…' : 'Add exercise'}
      </button>
    </form>
  );
}
