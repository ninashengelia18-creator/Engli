'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageCircle, BookOpen, Trophy, User } from 'lucide-react';

const TABS = [
  { href: '/learn', icon: Home, label: 'სწავლა' },
  { href: '/chat', icon: MessageCircle, label: 'საუბარი' },
  { href: '/words', icon: BookOpen, label: 'სიტყვები' },
  { href: '/leagues', icon: Trophy, label: 'ლიგა' },
  { href: '/profile', icon: User, label: 'პროფილი' }
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t-2 border-border flex">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const active = pathname?.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 flex flex-col items-center py-2.5 ${
              active ? 'text-primary' : 'text-ink-light'
            }`}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 2} />
            <span className="text-[11px] font-bold mt-0.5">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
