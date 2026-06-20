'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import type { Lang } from '@/lib/types';

export function Nav() {
  const pathname = usePathname();
  const { t, lang, setLang } = useI18n();

  const links = [
    { href: '/', label: t.nav.check },
    { href: '/matrix', label: t.nav.matrix },
    { href: '/reverse', label: t.nav.reverse },
    { href: '/audit', label: t.nav.audit },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-3">
          <span className="brand-wordmark text-lg">FORVIA</span>
          <span className="h-4 w-px bg-line" />
          <span className="hidden text-sm font-medium tracking-tight text-ink-soft sm:inline">
            {t.nav.subtitle}
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          <nav className="flex items-center gap-1">
            {links.map((l) => {
              const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-full px-3 py-1.5 text-sm transition ${
                    active ? 'bg-brand text-white' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center rounded-full border border-line bg-white p-0.5 text-xs font-semibold">
            {(['fr', 'en'] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
                className={`rounded-full px-2.5 py-1 uppercase transition ${
                  lang === l ? 'bg-brand text-white' : 'text-ink-muted hover:text-ink'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
