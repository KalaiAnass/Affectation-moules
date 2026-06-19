'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

/** Renders children only when authenticated; otherwise a tasteful sign-in prompt. */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid place-items-center py-24 text-sm text-ink-muted">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-ink" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <h2 className="text-lg font-semibold">Sign in required</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Compatibility data is restricted. Sign in to continue.
        </p>
        <Link href="/login" className="btn-primary mt-5">
          Sign in
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
