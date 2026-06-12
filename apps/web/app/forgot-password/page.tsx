'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthSplitLayout } from '@/components/auth/auth-split-layout';
import { PasswordField } from '@/components/auth/password-field';
import { ApiError, apiFetch } from '@/lib/api-client';

type Step = 'email' | 'reset';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSendReset(e: FormEvent) {
    e.preventDefault();
    setError('');
    setErrorCode('');
    setInfo('');
    setLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; message: string }>(
        '/auth/forgot-password',
        { method: 'POST', body: JSON.stringify({ email }) },
      );
      setInfo(res.message);
      setStep('reset');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setErrorCode(err.code ?? '');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to send reset code');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, otp, password, confirmPassword }),
      });
      router.push('/login?reset=success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplitLayout
      title="Reset your password"
      subtitle="We'll send a verification code to your email."
      footer={
        <>
          Remember your password?{' '}
          <Link href="/login" className="font-bold text-moons-navy hover:underline">
            Back to login
          </Link>
        </>
      }
    >
      {step === 'email' ? (
        <form onSubmit={handleSendReset} className="space-y-5">
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
              placeholder="Enter your account email"
              className="mt-2 w-full rounded-xl border border-border px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-moons-muted focus:border-moons-blue focus:ring-1 focus:ring-moons-blue"
            />
          </div>

          {error && (
            <div className="space-y-2">
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
              {errorCode === 'EMAIL_NOT_REGISTERED' && (
                <p className="text-center text-sm text-foreground">
                  <Link href="/register" className="font-semibold text-moons-blue hover:underline">
                    Create an account
                  </Link>
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-moons-blue py-3.5 text-sm font-semibold text-white transition hover:bg-moons-blue-dark disabled:opacity-60"
          >
            {loading ? 'Sending…' : 'Send reset code'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-5">
          <p className="text-sm text-foreground">
            Enter the code sent to <strong>{email}</strong>
          </p>
          {info && (
            <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-moons-silver">{info}</p>
          )}

          <div>
            <label htmlFor="otp" className="block text-sm font-bold text-moons-navy">
              Reset Code
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

          <PasswordField
            id="password"
            label="New Password"
            value={password}
            onChange={setPassword}
            minLength={8}
            placeholder="Min 8 characters"
          />

          <PasswordField
            id="confirmPassword"
            label="Confirm Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            minLength={8}
            placeholder="Re-enter password"
          />

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full rounded-full bg-moons-blue py-3.5 text-sm font-semibold text-white transition hover:bg-moons-blue-dark disabled:opacity-60"
          >
            {loading ? 'Resetting…' : 'Reset password'}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep('email');
              setOtp('');
              setError('');
            }}
            className="w-full text-sm text-moons-muted hover:text-moons-navy"
          >
            ← Use a different email
          </button>
        </form>
      )}
    </AuthSplitLayout>
  );
}
