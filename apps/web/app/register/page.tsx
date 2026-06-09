'use client';

import Link from 'next/link';
import { FormEvent, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserRole, type AuthResponse } from '@moons/shared';
import { AuthDivider } from '@/components/auth/auth-divider';
import { AuthSplitLayout } from '@/components/auth/auth-split-layout';
import { PasswordField } from '@/components/auth/password-field';
import { GoogleSignInButton } from '@/components/google-sign-in-button';
import { apiFetch } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

function RegisterForm() {
  const router = useRouter();
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const defaultRole =
    searchParams.get('role') === 'recruiter' ? UserRole.RECRUITER : UserRole.CANDIDATE;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(defaultRole);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiFetch<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, role }),
      });
      login(data);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplitLayout
      title="Create your account"
      subtitle="Register free to browse jobs, apply in one click, and get noticed by recruiters."
      footer={
        <>
          Already registered?{' '}
          <Link href="/login" className="font-bold text-moons-navy hover:underline">
            Login here
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <span className="block text-sm font-bold text-moons-navy">I am a</span>
          <div className="mt-2 flex gap-3">
            <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-sm font-medium transition has-[:checked]:border-moons-navy has-[:checked]:bg-slate-50">
              <input
                type="radio"
                name="role"
                className="accent-moons-navy"
                checked={role === UserRole.CANDIDATE}
                onChange={() => setRole(UserRole.CANDIDATE)}
              />
              Jobseeker
            </label>
            <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-sm font-medium transition has-[:checked]:border-moons-navy has-[:checked]:bg-slate-50">
              <input
                type="radio"
                name="role"
                className="accent-moons-navy"
                checked={role === UserRole.RECRUITER}
                onChange={() => setRole(UserRole.RECRUITER)}
              />
              Employer
            </label>
          </div>
        </div>

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
          placeholder="Min 8 characters"
        />

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-moons-navy py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? 'Creating account…' : 'Register'}
        </button>
      </form>

      <AuthDivider />

      <GoogleSignInButton role={role} variant="auth" />
    </AuthSplitLayout>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
          Loading…
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
