'use client';

import Link from 'next/link';

export default function LessonComplete({
  xpEarned,
  mistakes,
  lessonTitle,
  error
}: {
  xpEarned: number;
  mistakes: number;
  lessonTitle: string;
  error?: string | null;
}) {
  const score = Math.max(0, 100 - mistakes * 10);
  const isPerfect = mistakes === 0;
  const heroEmoji = isPerfect ? '🏆' : score >= 70 ? '🎉' : '💪';
  const heroTitle = isPerfect ? 'სრულყოფილი!' : score >= 70 ? 'ბრავო!' : 'კარგი ცდა!';

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center">
      <div className="text-8xl mb-4 animate-bounce" aria-hidden="true">
        {heroEmoji}
      </div>
      <h1 className="text-3xl font-extrabold text-accent mb-2">{heroTitle}</h1>
      <p className="text-ink-light mb-8">დაასრულე: {lessonTitle}</p>

      <div className="grid grid-cols-3 gap-3 w-full mb-8">
        <Stat icon="⭐" value={`${score}%`} label="ქულა" />
        <Stat icon="💎" value={`+${xpEarned}`} label="XP" />
        <Stat icon="❤️" value={`${Math.max(0, 5 - mistakes)}/5`} label="გული" />
      </div>

      {error && (
        <p className="text-xs text-danger mb-3 bg-red-50 border border-danger/30 rounded-xl px-3 py-2 max-w-xs">
          ⚠ პროგრესის შენახვა ვერ მოხერხდა — სცადე ხელახლა მოგვიანებით
        </p>
      )}

      <Link href="/learn" className="btn-primary w-full max-w-xs">
        გაგრძელება
      </Link>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="card text-center">
      <div className="text-2xl mb-1" aria-hidden="true">{icon}</div>
      <div className="text-lg font-extrabold">{value}</div>
      <div className="text-[11px] text-ink-light uppercase">{label}</div>
    </div>
  );
}
