'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { LearningGoal } from '@/types/db';

export async function completeOnboarding(input: {
  childName: string;
  childAge: number;
  learningGoal: LearningGoal;
}) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  await supabase
    .from('profiles')
    .update({
      child_name: input.childName,
      child_age: input.childAge,
      learning_goal: input.learningGoal
    })
    .eq('id', user.id);

  redirect('/learn');
}
