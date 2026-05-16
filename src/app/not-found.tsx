import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex flex-col items-center justify-center flex-1 px-6 py-12 text-center">
      <div className="text-7xl mb-4" aria-hidden="true">🦊</div>
      <h1 className="text-2xl font-extrabold text-primary mb-2">გვერდი ვერ მოიძებნა</h1>
      <p className="text-sm text-ink-light mb-6 max-w-xs">
        ეს გვერდი არ არსებობს ან გადატანილია. დაბრუნდი მთავარზე და განაგრძე სწავლა.
      </p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link href="/" className="btn-primary text-center">
          მთავარ გვერდზე
        </Link>
        <Link href="/help" className="btn-secondary text-center">
          დახმარება
        </Link>
      </div>
    </main>
  );
}
