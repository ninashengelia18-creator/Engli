import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect('/sign-in?next=/admin');
  if (!isAdminEmail(user.email)) {
    redirect('/learn');
  }

  const tabs: { href: string; label: string }[] = [
    { href: '/admin/worlds', label: 'Worlds' },
    { href: '/admin/units', label: 'Units' },
    { href: '/admin/lessons', label: 'Lessons' },
    { href: '/admin/analytics', label: 'Analytics' },
    { href: '/admin/users', label: 'Users' }
  ];

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b-2 border-border px-4 py-3 flex items-center justify-between bg-bg-soft">
        <div className="font-extrabold">⚙️ Admin</div>
        <Link href="/learn" className="text-sm text-secondary">
          ← App
        </Link>
      </header>
      <nav className="flex border-b-2 border-border bg-white text-xs overflow-x-auto">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="flex-1 min-w-[72px] py-3 text-center font-bold whitespace-nowrap"
          >
            {t.label}
          </Link>
        ))}
      </nav>
      <div className="flex-1 p-4 overflow-y-auto pb-12">{children}</div>
    </div>
  );
}
