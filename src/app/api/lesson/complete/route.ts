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

  const { data, error } = await supabase.rpc('complete_lesson', {
    p_lesson_id: lessonId,
    p_mistakes: mistakes,
    p_seconds: seconds
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ xpEarned: data });
}
