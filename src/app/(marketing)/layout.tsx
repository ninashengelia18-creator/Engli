import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 bg-white border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link
            href="/"
            className="p-2 -ml-2 rounded-lg active:bg-bg-soft"
            aria-label="უკან"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="font-extrabold text-primary">ენგლი</div>
        </div>
      </header>

      <main className="flex-1 px-5 py-6 marketing-prose">{children}</main>

      <footer className="border-t border-border px-5 py-6 text-xs text-ink-light">
        <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-2 mb-3">
          <Link href="/about-ai" className="underline">AI-ის შესახებ</Link>
          <Link href="/safety" className="underline">უსაფრთხოება</Link>
          <Link href="/parent-guide" className="underline">მშობლის გზამკვლევი</Link>
          <Link href="/help" className="underline">დახმარება</Link>
          <Link href="/contact" className="underline">კონტაქტი</Link>
          <Link href="/privacy" className="underline">კონფიდენციალურობა</Link>
          <Link href="/terms" className="underline">პირობები</Link>
        </nav>
        <p>© Engli · ენგლი — Your Next Tutor Inc.</p>
      </footer>
    </div>
  );
}
