export default function Loading() {
  return (
    <main
      className="flex flex-col items-center justify-center flex-1 px-6 py-12"
      role="status"
      aria-live="polite"
    >
      <div className="text-6xl mb-4 animate-bounce" aria-hidden="true">🦊</div>
      <div className="text-sm font-semibold text-ink-light">იტვირთება…</div>
      <span className="sr-only">გვერდი იტვირთება</span>
    </main>
  );
}
