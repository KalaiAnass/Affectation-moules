'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Check' },
  { href: '/matrix', label: 'Matrix' },
  { href: '/reverse', label: 'Reverse' },
  { href: '/audit', label: 'Audit' },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-3">
          <span className="brand-wordmark text-lg">FORVIA</span>
          <span className="h-4 w-px bg-line" />
          <span className="text-sm font-medium tracking-tight text-ink-soft">
            Mold <span className="text-brand-sky">↔</span> Press
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map((l) => {
            const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-full px-3.5 py-1.5 text-sm transition ${
                  active ? 'bg-brand text-white' : 'text-ink-muted hover:text-ink'
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
