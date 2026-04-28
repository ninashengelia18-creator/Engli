import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LessonPlayer from '@/components/lesson/LessonPlayer';

export default async function LessonPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: lesson } = await supabase
    .from('lessons')
    .select('*, exercises(*), units!inner(is_premium, world_id, worlds!inner(is_premium))')
    .eq('id', params.id)
    .eq('is_published', true)
    .single();

  if (!lesson) redirect('/learn');

  // Premium gating
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('tier, status')
    .eq('user_id', user.id)
    .single();
  const isPremium =
    subscription?.tier !== 'free' &&
    (subscription?.status === 'active' || subscription?.status === 'trialing');
  const lessonRequiresPremium =
    lesson.units?.is_premium || lesson.units?.worlds?.is_premium;
  if (lessonRequiresPremium && !isPremium) redirect('/upgrade');

  const exercises = (lesson.exercises ?? []).sort(
    (a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order
  );

  return (
    <div className="fixed inset-0 bg-white max-w-md mx-auto flex flex-col z-50">
      <LessonPlayer lessonId={lesson.id} lessonTitle={lesson.title_ka} exercises={exercises} xpReward={lesson.xp_reward} />
    </div>
  );
}
