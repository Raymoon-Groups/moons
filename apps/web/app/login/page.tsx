'use client';

import Link from 'next/link';
import { FormEvent, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserRole } from '@moons/shared';
import { AuthDivider } from '@/components/auth/auth-divider';
import { AuthSplitLayout } from '@/components/auth/auth-split-layout';
import { PasswordField } from '@/components/auth/password-field';
import { GoogleSignInButton } from '@/components/google-sign-in-button';
import { ApiError, apiFetch } from '@/lib/api-client';
import { getPostAuthPath } from '@/lib/auth-redirect';
import { useAuth } from '@/lib/auth-context';
import type { AuthResponse } from '@moons/shared';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const defaultRole =
    searchParams.get('role') === 'recruiter' ? UserRole.RECRUITER : UserRole.CANDIDATE;
  const resetSuccess = searchParams.get('reset') === 'success';

  const [googleRole, setGoogleRole] = useState<UserRole>(defaultRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isGoogleAccount, setIsGoogleAccount] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsGoogleAccount(false);
    setLoading(true);
    try {
      const data = await apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      login(data);
      router.push(getPostAuthPath(data.user));
    } catch (err) {
      if (err instanceof ApiError && err.code === 'GOOGLE_ACCOUNT') {
        setIsGoogleAccount(true);
      }
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
      {resetSuccess && (
        <p className="mb-5 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
          Password reset successfully. You can now sign in.
        </p>
      )}

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
            className="mt-2 w-full rounded-xl border border-border px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-moons-muted focus:border-moons-blue focus:ring-1 focus:ring-moons-blue"
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

        <div className="text-right text-sm">
          <Link href="/forgot-password" className="text-moons-blue hover:underline">
            Forgot Password?
          </Link>
        </div>

        {error && (
          <div className="space-y-3">
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
            {isGoogleAccount && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <p className="font-medium">Sign in with Google instead</p>
                <p className="mt-1 text-amber-800">
                  Or sign in with Google first, then create a password in{' '}
                  <Link href="/settings/security" className="font-semibold underline">
                    Settings → Security
                  </Link>
                  .
                </p>
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-moons-blue py-3.5 text-sm font-semibold text-white transition hover:bg-moons-blue-dark disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Login'}
        </button>
      </form>

      <AuthDivider />

      <div>
        <span className="block text-sm font-bold text-moons-navy">New user? I am a</span>
        <p className="mt-1 text-xs text-moons-muted">
          Choose your role before Google sign-in. Existing accounts keep their current role.
        </p>
        <div className="mt-2 flex gap-3">
          <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border px-3 py-3 text-sm font-medium transition has-[:checked]:border-moons-navy has-[:checked]:bg-surface">
            <input
              type="radio"
              name="googleRole"
              className="accent-moons-navy"
              checked={googleRole === UserRole.CANDIDATE}
              onChange={() => setGoogleRole(UserRole.CANDIDATE)}
            />
            Jobseeker
          </label>
          <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border px-3 py-3 text-sm font-medium transition has-[:checked]:border-moons-navy has-[:checked]:bg-surface">
            <input
              type="radio"
              name="googleRole"
              className="accent-moons-navy"
              checked={googleRole === UserRole.RECRUITER}
              onChange={() => setGoogleRole(UserRole.RECRUITER)}
            />
            Employer
          </label>
        </div>
      </div>

      <div className="mt-4">
        <GoogleSignInButton role={googleRole} variant="auth" />
      </div>

      <p className="mt-6 rounded-xl bg-blue-50 px-4 py-3 text-xs leading-relaxed text-foreground">
        Demo: candidate@moons.com or recruiter@moons.com · password123
      </p>
    </AuthSplitLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-moons-muted">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
