/**
 * Lightweight, fire-and-forget analytics. Events are written to the
 * `analytics_events` table when present; failures are silenced because
 * analytics must never break a learning flow.
 */
import { createClient } from '@/lib/supabase/client';

export type AnalyticsEvent =
  | { name: 'lesson_start'; lesson_id: string }
  | { name: 'lesson_complete'; lesson_id: string; mistakes: number; seconds: number }
  | { name: 'lesson_abandon'; lesson_id: string; at_index: number; total: number }
  | { name: 'exercise_stuck'; lesson_id: string; exercise_id: string; attempts: number }
  | { name: 'onboarding_complete'; goal: string; age: number }
  | { name: 'upgrade_view' }
  | { name: 'upgrade_click'; price_key: string };

export function track(event: AnalyticsEvent): void {
  if (typeof window === 'undefined') return;
  try {
    const supabase = createClient();
    const { name, ...props } = event;
    // Best-effort. Schema: (user_id uuid, name text, props jsonb, created_at timestamptz default now())
    void supabase
      .from('analytics_events')
      .insert({ name, props })
      .then(() => undefined, () => undefined);
  } catch {
    // swallow
  }
}
