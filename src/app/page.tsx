import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center px-6 py-12 flex-1 text-center">
      <div className="text-8xl mb-4 animate-bounce" aria-hidden="true">🦊</div>
      <h1 className="text-4xl font-extrabold text-primary mb-2 tracking-tight">ენგლი</h1>
      <p className="text-lg font-semibold text-ink mb-2">Engli</p>
      <p className="text-ink-light mb-8 max-w-xs leading-relaxed">
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

      <div className="mt-12 grid grid-cols-3 gap-4 text-xs text-ink-light max-w-xs">
        <Feature emoji="🎮" label="სახალისო თამაშები" />
        <Feature emoji="🎤" label="ხმოვანი ვარჯიში" />
        <Feature emoji="🤖" label="AI მასწავლებელი" />
      </div>

      <nav
        aria-label="საინფორმაციო გვერდები"
        className="mt-10 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-ink-light max-w-xs"
      >
        <Link href="/parent-guide" className="underline">მშობელს</Link>
        <Link href="/safety" className="underline">უსაფრთხოება</Link>
        <Link href="/about-ai" className="underline">AI-ის შესახებ</Link>
        <Link href="/help" className="underline">დახმარება</Link>
        <Link href="/privacy" className="underline">კონფიდენციალურობა</Link>
        <Link href="/terms" className="underline">პირობები</Link>
      </nav>

      <div className="mt-6 text-xs text-ink-lighter">Made with 💚 in Georgia</div>
    </main>
  );
}

function Feature({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div>
      <div className="text-2xl mb-1" aria-hidden="true">{emoji}</div>
      <div>{label}</div>
    </div>
  );
}
