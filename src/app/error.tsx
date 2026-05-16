'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production this surfaces in Vercel/runtime logs; locally it's just
    // a console line. Keeping it light so a render failure on the auth
    // path doesn't itself crash with a logging-library error.
    // eslint-disable-next-line no-console
    console.error('App error:', error.digest, error.message);
  }, [error]);

  return (
    <main className="flex flex-col items-center justify-center flex-1 px-6 py-12 text-center">
      <div className="text-7xl mb-4" aria-hidden="true">🛠️</div>
      <h1 className="text-2xl font-extrabold text-primary mb-2">რაღაც შეფერხდა</h1>
      <p className="text-sm text-ink-light mb-1 max-w-xs">
        პრობლემა გვაქვს გვერდის ჩატვირთვისას. სცადე ისევ — ხშირად ეს გვშველის.
      </p>
      {error.digest && (
        <p className="text-[10px] text-ink-lighter mb-6">კოდი: {error.digest}</p>
      )}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button onClick={reset} className="btn-primary">
          სცადე ისევ
        </button>
        <Link href="/" className="btn-secondary text-center">
          მთავარ გვერდზე
        </Link>
        <Link href="/help" className="text-xs text-secondary underline mt-2">
          დახმარება
        </Link>
      </div>
    </main>
  );
}
