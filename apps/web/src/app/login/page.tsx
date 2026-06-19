'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, ApiError, setToken } from '@/lib/api';

const demoUsers = [
  { email: 'admin@forvia.local', role: 'Administrator' },
  { email: 'engineer@forvia.local', role: 'Engineer' },
  { email: 'technician@forvia.local', role: 'Technician' },
  { email: 'viewer@forvia.local', role: 'Read only' },
];

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signIn(email: string) {
    setLoading(email);
    setError(null);
    try {
      const { accessToken } = await api.devLogin(email);
      setToken(accessToken);
      router.push('/');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Sign-in failed');
      setLoading(null);
    }
  }

  return (
    <div className="mx-auto max-w-md pt-10">
      <div className="card p-8">
        <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-ink-muted">
          In production this is handled by your company SSO (Azure AD / Entra ID). For local
          development, choose a demo role below.
        </p>

        <div className="mt-6 space-y-2">
          {demoUsers.map((u) => (
            <button
              key={u.email}
              onClick={() => signIn(u.email)}
              disabled={loading !== null}
              className="flex w-full items-center justify-between rounded-2xl border border-line bg-white px-4 py-3 text-left transition hover:border-ink-muted/40 disabled:opacity-50"
            >
              <div>
                <div className="font-medium">{u.role}</div>
                <div className="text-xs text-ink-muted">{u.email}</div>
              </div>
              {loading === u.email ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-ink" />
              ) : (
                <span className="text-ink-muted">→</span>
              )}
            </button>
          ))}
        </div>

        {error && <p className="mt-4 rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{error}</p>}
      </div>
    </div>
  );
}
