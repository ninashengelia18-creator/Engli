import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/admin';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect('/sign-in?next=/admin');
  if (!isAdminEmail(user.email)) {
    redirect('/learn');
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b-2 border-border px-4 py-3 flex items-center justify-between bg-bg-soft">
        <div className="font-extrabold">⚙️ Admin</div>
        <Link href="/learn" className="text-sm text-secondary">
          ← App
        </Link>
      </header>
      <nav className="flex border-b-2 border-border bg-white text-sm">
        <Link href="/admin/worlds" className="flex-1 py-3 text-center font-bold">
          Worlds
        </Link>
        <Link href="/admin/lessons" className="flex-1 py-3 text-center font-bold">
          Lessons
        </Link>
        <Link href="/admin/users" className="flex-1 py-3 text-center font-bold">
          Users
        </Link>
      </nav>
      <div className="flex-1 p-4 overflow-y-auto">{children}</div>
    </div>
  );
}
