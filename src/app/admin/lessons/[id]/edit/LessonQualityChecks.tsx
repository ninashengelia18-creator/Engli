import type { Exercise } from '@/types/db';

type ExerciseRow = Pick<Exercise, 'id' | 'exercise_type' | 'data' | 'display_order'>;

type Issue = { level: 'warn' | 'error'; label: string; detail: string };

// Pure, server-renderable content-quality checks for a lesson's exercises.
// Heuristics only — meant to surface obvious authoring mistakes (duplicates,
// short prompts, no speak/listen variety) before publishing. Anything truly
// broken should already be caught by validateExercisePayload.
function detectIssues(exercises: ExerciseRow[]): Issue[] {
  const issues: Issue[] = [];

  if (exercises.length < 3) {
    issues.push({
      level: 'warn',
      label: 'Short lesson',
      detail: `Only ${exercises.length} exercises — Duolingo-style flow works better with 5–10.`
    });
  }

  // Display-order sanity: should be a strictly increasing sequence with no
  // gaps or duplicates. reorderExercise can race; this surfaces drift.
  const sorted = [...exercises].sort((a, b) => a.display_order - b.display_order);
  const seenOrders = new Set<number>();
  for (let i = 0; i < sorted.length; i++) {
    const ex = sorted[i];
    if (seenOrders.has(ex.display_order)) {
      issues.push({
        level: 'error',
        label: 'Duplicate display_order',
        detail: `Two exercises share display_order=${ex.display_order} — reorder may have raced.`
      });
    }
    seenOrders.add(ex.display_order);
    if (ex.display_order !== i + 1) {
      issues.push({
        level: 'warn',
        label: 'Order gap',
        detail: `Exercise at position ${i + 1} has display_order=${ex.display_order} (expected ${i + 1}).`
      });
      break;
    }
  }

  // Exercise-type mix — flag lessons that are 100% one type.
  const types = new Set(exercises.map((e) => e.exercise_type));
  if (exercises.length >= 4 && types.size === 1) {
    issues.push({
      level: 'warn',
      label: 'Only one exercise type',
      detail: `All ${exercises.length} exercises are "${[...types][0]}" — mix learn / match / speak / build for retention.`
    });
  }

  // Duplicate prompts inside the lesson (e.g. two match exercises with the
  // same Georgian prompt and correct answer).
  const promptKeys = new Map<string, number>();
  for (const ex of exercises) {
    const key = promptKeyFor(ex);
    if (!key) continue;
    promptKeys.set(key, (promptKeys.get(key) ?? 0) + 1);
  }
  for (const [key, count] of promptKeys) {
    if (count > 1) {
      issues.push({
        level: 'warn',
        label: 'Repeated prompt',
        detail: `"${key}" appears in ${count} exercises — consider varying the prompt.`
      });
    }
  }

  return issues;
}

function promptKeyFor(ex: ExerciseRow): string | null {
  const d = (ex.data ?? {}) as Record<string, unknown>;
  const grab = (k: string) => (typeof d[k] === 'string' ? (d[k] as string).trim().toLowerCase() : '');
  switch (ex.exercise_type) {
    case 'learn':
      return grab('en') || null;
    case 'match':
    case 'listen':
      return grab('prompt_ka') || grab('correct') || null;
    case 'speak':
      return grab('target') || null;
    case 'translate':
      return grab('source_en') || null;
    default:
      return null;
  }
}

export default function LessonQualityChecks({ exercises }: { exercises: ExerciseRow[] }) {
  const issues = detectIssues(exercises);
  if (issues.length === 0) return null;

  return (
    <section className="card bg-bg-soft border-accent/40">
      <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink-light mb-2">
        Quality checks ({issues.length})
      </h2>
      <ul className="space-y-2 text-sm">
        {issues.map((issue, i) => (
          <li key={i} className="flex gap-2">
            <span aria-hidden="true">{issue.level === 'error' ? '🚨' : '⚠️'}</span>
            <div>
              <div className="font-bold">{issue.label}</div>
              <div className="text-xs text-ink-light">{issue.detail}</div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
