import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center px-6 py-12 flex-1 text-center">
      <div className="text-8xl mb-4">🦊</div>
      <h1 className="text-4xl font-extrabold text-primary mb-2">ენგლი</h1>
      <p className="text-lg font-semibold text-ink mb-2">Engli</p>
      <p className="text-ink-light mb-8 max-w-xs">
        ისწავლე ინგლისური სახალისოდ — ქართველი ბავშვებისთვის
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link href="/sign-up" className="btn-primary text-center">
          დაიწყე უფასოდ
        </Link>
        <Link href="/sign-in" className="btn-secondary text-center">
          შესვლა
        </Link>
      </div>

      <div className="mt-12 grid grid-cols-3 gap-4 text-xs text-ink-light">
        <div>
          <div className="text-2xl mb-1">🎮</div>
          <div>სახალისო თამაშები</div>
        </div>
        <div>
          <div className="text-2xl mb-1">🎤</div>
          <div>ხმოვანი ვარჯიში</div>
        </div>
        <div>
          <div className="text-2xl mb-1">🤖</div>
          <div>AI მასწავლებელი</div>
        </div>
      </div>

      <div className="mt-12 text-xs text-ink-lighter">
        Made with 💚 in Georgia
      </div>
    </main>
  );
}
