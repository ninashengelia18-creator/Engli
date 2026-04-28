'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  return (
    <button onClick={handleSignOut} className="w-full text-center text-danger font-bold py-3 mt-4">
      გასვლა
    </button>
  );
}
