import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import OnboardingFlow from './OnboardingFlow';

export default async function OnboardingPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('profiles')
    .select('child_name')
    .eq('id', user.id)
    .single();

  if (profile?.child_name) redirect('/learn');

  return <OnboardingFlow />;
}
