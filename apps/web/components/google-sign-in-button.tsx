'use client';

import { GoogleLogin } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import { UserRole, type AuthResponse } from '@moons/shared';
import { apiFetch } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

interface GoogleSignInButtonProps {
  role?: UserRole;
  variant?: 'default' | 'auth';
}

export function GoogleSignInButton({
  role = UserRole.CANDIDATE,
  variant = 'default',
}: GoogleSignInButtonProps) {
  const router = useRouter();
  const { login } = useAuth();
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  async function handleSuccess(idToken: string | undefined) {
    if (!idToken) {
      alert('Google sign-in failed — no token received');
      return;
    }
    try {
      const data = await apiFetch<AuthResponse>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken, role }),
      });
      login(data);
      router.push('/dashboard');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Google sign-in failed');
    }
  }

  if (!clientId) {
    return (
      <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
        Google sign-in is not configured. Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to .env.local
      </p>
    );
  }

  const wrapperClass =
    variant === 'auth'
      ? 'overflow-hidden rounded-full border border-slate-200 [&>div]:flex [&>div]:w-full [&>div]:justify-center [&_iframe]:!max-w-full'
      : 'flex justify-center [&>div]:w-full';

  return (
    <div className={wrapperClass}>
      <GoogleLogin
        text="continue_with"
        shape={variant === 'auth' ? 'pill' : 'rectangular'}
        theme="outline"
        size="large"
        width={variant === 'auth' ? 400 : 360}
        onSuccess={(res) => handleSuccess(res.credential)}
        onError={() => alert('Google sign-in was cancelled or failed')}
      />
    </div>
  );
}
