'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { ApiError, apiFetch } from '@/lib/api-client';
import { setAdminPortalFlagCookie } from '@/lib/admin-portal';

export function AdminLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/admin';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiFetch<{ ok: boolean; username: string }>('/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username: username.trim(), password }),
        skipAuthRetry: true,
        cache: false,
      });
      setAdminPortalFlagCookie();
      router.replace(next.startsWith('/admin') ? next : '/admin');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not sign in');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="li-page-bg flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border/70 bg-surface-elevated p-8 shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moons-blue">MoonsJob</p>
        <h1 className="mt-2 text-2xl font-bold text-foreground">Admin sign in</h1>
        <p className="mt-2 text-sm text-moons-muted">
          Use your admin username and password to manage blogs, newsletter, and announcements.
        </p>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 space-y-4">
          <div>
            <label htmlFor="admin-username" className="text-sm font-semibold text-foreground">
              Username
            </label>
            <input
              id="admin-username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none ring-moons-blue/30 focus:ring-2"
              required
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="text-sm font-semibold text-foreground">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none ring-moons-blue/30 focus:ring-2"
              required
              minLength={8}
            />
          </div>

          {error ? (
            <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-600">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-moons-blue py-3 text-sm font-bold text-white transition hover:opacity-95 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <Link href="/" className="mt-6 block text-center text-sm font-semibold text-moons-muted hover:text-foreground">
          Back to moonsjob.com
        </Link>
      </div>
    </div>
  );
}
