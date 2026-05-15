'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function AppError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('App segment error:', error.digest, error.message);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="text-6xl mb-3" aria-hidden="true">😕</div>
      <h2 className="text-xl font-extrabold mb-1">ვერ ჩაიტვირთა</h2>
      <p className="text-sm text-ink-light mb-5 max-w-xs">
        გაკვეთილების ჩატვირთვაში პრობლემა გვაქვს. სცადე ხელახლა.
      </p>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        <button onClick={reset} className="btn-primary">
          სცადე ისევ
        </button>
        <Link href="/learn" className="btn-secondary text-center">
          ჩემს გაკვეთილებზე
        </Link>
        <Link href="/help" className="text-xs text-secondary underline mt-2">
          მიწერე — დახმარება
        </Link>
      </div>
    </div>
  );
}
