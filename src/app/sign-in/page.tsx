'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function SignInPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else router.push('/learn');
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
  }

  return (
    <main className="flex-1 flex flex-col px-6 py-8">
      <Link href="/" className="text-ink-light text-2xl">
        ←
      </Link>

      <div className="mt-8 mb-8">
        <h1 className="text-2xl font-extrabold mb-2">შესვლა</h1>
        <p className="text-ink-light text-sm">გააგრძელე სწავლა</p>
      </div>

      <form onSubmit={handleEmailSignIn} className="flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder="ელფოსტა"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border-2 border-border rounded-xl px-4 py-3 text-base focus:outline-none focus:border-secondary"
        />
        <input
          type="password"
          required
          placeholder="პაროლი"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border-2 border-border rounded-xl px-4 py-3 text-base focus:outline-none focus:border-secondary"
        />
        {error && <p className="text-danger text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary mt-2">
          {loading ? '...' : 'შესვლა'}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-ink-lighter text-sm">ან</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <button onClick={handleGoogle} className="btn-secondary">
        🔵 Google-ით შესვლა
      </button>

      <p className="mt-8 text-center text-sm text-ink-light">
        ახალი ხარ?{' '}
        <Link href="/sign-up" className="text-secondary font-bold">
          რეგისტრაცია
        </Link>
      </p>
    </main>
  );
}
