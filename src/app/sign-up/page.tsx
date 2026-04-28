'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function SignUpPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState(8);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { child_name: childName, child_age: childAge } }
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    if (data.user) {
      await supabase
        .from('profiles')
        .update({ child_name: childName, child_age: childAge })
        .eq('id', data.user.id);
    }
    setLoading(false);
    router.push('/learn');
  }

  return (
    <main className="flex-1 flex flex-col px-6 py-8">
      <Link href="/" className="text-ink-light text-2xl">
        ←
      </Link>

      <div className="mt-8 mb-8">
        <h1 className="text-2xl font-extrabold mb-2">რეგისტრაცია</h1>
        <p className="text-ink-light text-sm">დაიწყე უფასოდ</p>
      </div>

      <form onSubmit={handleSignUp} className="flex flex-col gap-3">
        <input
          required
          placeholder="ბავშვის სახელი"
          value={childName}
          onChange={(e) => setChildName(e.target.value)}
          className="border-2 border-border rounded-xl px-4 py-3 text-base focus:outline-none focus:border-secondary"
        />
        <div>
          <label className="block text-sm text-ink-light mb-2">ასაკი: {childAge}</label>
          <input
            type="range"
            min={4}
            max={16}
            value={childAge}
            onChange={(e) => setChildAge(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>
        <input
          type="email"
          required
          placeholder="თქვენი ელფოსტა"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border-2 border-border rounded-xl px-4 py-3 text-base focus:outline-none focus:border-secondary"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="პაროლი (მინ. 6 სიმბოლო)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border-2 border-border rounded-xl px-4 py-3 text-base focus:outline-none focus:border-secondary"
        />
        {error && <p className="text-danger text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary mt-2">
          {loading ? '...' : 'რეგისტრაცია'}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-ink-light">
        უკვე გაქვს ანგარიში?{' '}
        <Link href="/sign-in" className="text-secondary font-bold">
          შესვლა
        </Link>
      </p>
    </main>
  );
}
