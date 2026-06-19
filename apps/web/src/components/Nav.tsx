'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const links = [
  { href: '/', label: 'Check' },
  { href: '/matrix', label: 'Matrix' },
  { href: '/reverse', label: 'Reverse' },
  { href: '/audit', label: 'Audit' },
];

export function Nav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-ink text-[13px] text-white">M</span>
          <span>Mold<span className="text-ink-muted">↔</span>Press</span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {links.map((l) => {
            const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-full px-3.5 py-1.5 text-sm transition ${
                  active ? 'bg-ink text-white' : 'text-ink-muted hover:text-ink'
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <span className="hidden text-ink-muted sm:inline">
                {user.email}
                <span className="ml-2 rounded-full bg-paper px-2 py-0.5 text-xs ring-1 ring-line">
                  {user.roles[0]}
                </span>
              </span>
              <button onClick={logout} className="text-ink-muted hover:text-bad">
                Sign out
              </button>
            </>
          ) : (
            <Link href="/login" className="btn-primary">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
