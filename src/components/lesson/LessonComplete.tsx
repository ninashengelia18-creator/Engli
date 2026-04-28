'use client';

import Link from 'next/link';

export default function LessonComplete({
  xpEarned,
  mistakes,
  lessonTitle
}: {
  xpEarned: number;
  mistakes: number;
  lessonTitle: string;
}) {
  const score = Math.max(0, 100 - mistakes * 10);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <div className="text-8xl animate-bounce mb-4">🎉</div>
      <h1 className="text-3xl font-extrabold text-accent mb-2">ბრავო!</h1>
      <p className="text-ink-light mb-8">დაასრულე: {lessonTitle}</p>

      <div className="grid grid-cols-3 gap-3 w-full mb-8">
        <Stat icon="⭐" value={`${score}%`} label="ქულა" />
        <Stat icon="💎" value={`+${xpEarned}`} label="XP" />
        <Stat icon="❤️" value={`${5 - mistakes}/5`} label="გული" />
      </div>

      <Link href="/learn" className="btn-primary w-full">
        გაგრძელება
      </Link>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="card text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-lg font-extrabold">{value}</div>
      <div className="text-[11px] text-ink-light uppercase">{label}</div>
    </div>
  );
}
