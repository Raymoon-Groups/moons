'use client';

import Link from 'next/link';
import { FormEvent, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserRole, type AuthResponse } from '@moons/shared';
import { AuthDivider } from '@/components/auth/auth-divider';
import { AuthSplitLayout } from '@/components/auth/auth-split-layout';
import { PasswordField } from '@/components/auth/password-field';
import { GoogleSignInButton } from '@/components/google-sign-in-button';
import { ApiError, apiFetch } from '@/lib/api-client';
import { getPostAuthPath } from '@/lib/auth-redirect';
import { useAuth } from '@/lib/auth-context';

type Step = 'credentials' | 'otp';

function RegisterForm() {
  const router = useRouter();
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const defaultRole =
    searchParams.get('role') === 'recruiter' ? UserRole.RECRUITER : UserRole.CANDIDATE;

  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [role, setRole] = useState<UserRole>(defaultRole);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSendOtp(e: FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; message: string }>(
        '/auth/register/send-otp',
        {
          method: 'POST',
          body: JSON.stringify({ email, password, role }),
        },
      );
      setInfo(res.message);
      setStep('otp');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'GOOGLE_ACCOUNT_EXISTS') {
        setError(
          'An account with this email already exists. Please sign in with Google instead.',
        );
      } else if (err instanceof ApiError && err.code === 'ACCOUNT_EXISTS') {
        setError('Account already exists. Please log in instead.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to send verification code');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; message: string }>(
        '/auth/register/resend-otp',
        { method: 'POST', body: JSON.stringify({ email }) },
      );
      setInfo(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiFetch<AuthResponse>('/auth/register/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      });
      login(data);
      router.push(getPostAuthPath(data.user));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
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
          <Link href="/login" className="font-bold text-heading hover:underline">
            Login here
          </Link>
        </>
      }
    >
      {step === 'credentials' ? (
        <form onSubmit={handleSendOtp} className="space-y-5">
          <div>
            <span className="block text-sm font-bold text-heading">I am a</span>
            <div className="mt-2 flex gap-3">
              <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border px-3 py-3 text-sm font-medium transition has-[:checked]:border-moons-navy has-[:checked]:bg-surface">
                <input
                  type="radio"
                  name="role"
                  className="accent-moons-navy"
                  checked={role === UserRole.CANDIDATE}
                  onChange={() => setRole(UserRole.CANDIDATE)}
                />
                Jobseeker
              </label>
              <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border px-3 py-3 text-sm font-medium transition has-[:checked]:border-moons-navy has-[:checked]:bg-surface">
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
            <label htmlFor="email" className="block text-sm font-bold text-heading">
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
            placeholder="Min 8 characters"
          />

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-moons-blue py-3.5 text-sm font-semibold text-white transition hover:bg-moons-blue-dark disabled:opacity-60"
          >
            {loading ? 'Sending code…' : 'Continue'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <p className="text-sm text-foreground">
            We sent a 6-digit code to <strong>{email}</strong>
          </p>
          {info && (
            <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-moons-silver">{info}</p>
          )}

          <div>
            <label htmlFor="otp" className="block text-sm font-bold text-heading">
              Verification Code
            </label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="mt-2 w-full rounded-xl border border-border px-4 py-3 text-center text-lg tracking-[0.5em] text-foreground outline-none transition placeholder:text-moons-muted focus:border-moons-blue focus:ring-1 focus:ring-moons-blue"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full rounded-full bg-moons-blue py-3.5 text-sm font-semibold text-white transition hover:bg-moons-blue-dark disabled:opacity-60"
          >
            {loading ? 'Verifying…' : 'Verify & Create Account'}
          </button>

          <button
            type="button"
            onClick={handleResendOtp}
            disabled={loading}
            className="w-full text-sm font-medium text-moons-blue hover:underline disabled:opacity-60"
          >
            Resend code
          </button>

          <button
            type="button"
            onClick={() => {
              setStep('credentials');
              setOtp('');
              setError('');
            }}
            className="w-full text-sm text-moons-muted hover:text-heading"
          >
            ← Back to edit email
          </button>
        </form>
      )}

      {step === 'credentials' && (
        <>
          <AuthDivider />
          <GoogleSignInButton role={role} variant="auth" />
        </>
      )}
    </AuthSplitLayout>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-moons-muted">
          Loading…
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
