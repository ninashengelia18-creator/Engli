'use client';

import Link from 'next/link';

type AchievementBadge = {
  slug: string;
  title_ka: string;
  emoji: string;
};

export default function LessonComplete({
  xpEarned,
  mistakes,
  lessonTitle,
  error,
  achievements = []
}: {
  xpEarned: number;
  mistakes: number;
  lessonTitle: string;
  error?: string | null;
  achievements?: AchievementBadge[];
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

      <div className="grid grid-cols-3 gap-3 w-full mb-6">
        <Stat icon="⭐" value={`${score}%`} label="ქულა" />
        <Stat icon="💎" value={`+${xpEarned}`} label="XP" />
        <Stat icon="❤️" value={`${Math.max(0, 5 - mistakes)}/5`} label="გული" />
      </div>

      {achievements.length > 0 && (
        <section
          className="w-full max-w-xs mb-6 card bg-yellow-50 border-accent"
          aria-label="ახალი მიღწევები"
        >
          <div className="text-xs font-extrabold text-accent uppercase mb-2">
            ახალი მიღწევა!
          </div>
          <ul className="space-y-2">
            {achievements.map((a) => (
              <li key={a.slug} className="flex items-center gap-2 text-left">
                <span className="text-2xl" aria-hidden="true">
                  {a.emoji}
                </span>
                <span className="font-bold text-sm">{a.title_ka}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

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
