import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { lessonId?: string; mistakes?: number; seconds?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const lessonId = body.lessonId;
  if (!lessonId || typeof lessonId !== 'string') {
    return NextResponse.json({ error: 'Missing lessonId' }, { status: 400 });
  }
  const mistakes = Math.max(0, Math.min(Math.floor(body.mistakes ?? 0), 100));
  const seconds = Math.max(0, Math.min(Math.floor(body.seconds ?? 0), 60 * 60));

  // complete_lesson() returns the XP awarded; it also internally inserts
  // any newly-earned user_achievements (see 20260520_achievements_grant).
  // We snapshot achievements before and after so we can return the freshly
  // earned ones to the client for the completion screen.
  const { data: before } = await supabase
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', user.id);
  const beforeIds = new Set((before ?? []).map((a) => a.achievement_id));

  const { data: xpEarned, error } = await supabase.rpc('complete_lesson', {
    p_lesson_id: lessonId,
    p_mistakes: mistakes,
    p_seconds: seconds
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const { data: after } = await supabase
    .from('user_achievements')
    .select('achievement_id, achievements(slug, title_ka, emoji)')
    .eq('user_id', user.id);

  type AfterRow = {
    achievement_id: string;
    achievements: { slug: string; title_ka: string; emoji: string | null } | null;
  };

  const earned = ((after ?? []) as unknown as AfterRow[])
    .filter((a) => !beforeIds.has(a.achievement_id))
    .map((a) => ({
      slug: a.achievements?.slug ?? '',
      title_ka: a.achievements?.title_ka ?? '',
      emoji: a.achievements?.emoji ?? '🏅'
    }));

  return NextResponse.json({ xpEarned, achievements: earned });
}
