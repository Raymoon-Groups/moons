'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthDivider } from '@/components/auth/auth-divider';
import { AuthSplitLayout } from '@/components/auth/auth-split-layout';
import { PasswordField } from '@/components/auth/password-field';
import { GoogleSignInButton } from '@/components/google-sign-in-button';
import { apiFetch } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import type { AuthResponse } from '@moons/shared';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      login(data);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplitLayout
      title="Welcome Back!"
      subtitle="Log in to find jobs, track applications, and manage your profile."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-bold text-moons-navy hover:underline">
            Sign up here
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-bold text-moons-navy">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Input your email"
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-moons-navy focus:ring-1 focus:ring-moons-navy"
          />
        </div>

        <PasswordField
          id="password"
          label="Password"
          value={password}
          onChange={setPassword}
          minLength={8}
          placeholder="Input your password"
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex cursor-pointer items-center gap-2 text-slate-600">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-moons-navy focus:ring-moons-navy"
            />
            Remember Me
          </label>
          <span className="text-slate-500">Forgot Password?</span>
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-moons-navy py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Login'}
        </button>
      </form>

      <AuthDivider />

      <GoogleSignInButton variant="auth" />

      <p className="mt-6 rounded-xl bg-blue-50 px-4 py-3 text-xs leading-relaxed text-slate-600">
        Demo: candidate@moons.com or recruiter@moons.com · password123
      </p>
    </AuthSplitLayout>
  );
}
