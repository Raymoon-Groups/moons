'use client';

import { GoogleLogin } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { UserRole, type AuthResponse } from '@moons/shared';
import { apiFetch } from '@/lib/api-client';
import { getPostAuthPath } from '@/lib/auth-redirect';
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
  const [error, setError] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const [btnWidth, setBtnWidth] = useState(320);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function measure() {
      const w = el!.getBoundingClientRect().width;
      if (w > 0) {
        setBtnWidth(Math.min(Math.floor(w), 400));
      }
    }

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  async function handleSuccess(idToken: string | undefined) {
    if (!idToken) {
      setError('Google sign-in failed — no token received');
      return;
    }
    setError('');
    try {
      const data = await apiFetch<AuthResponse>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken, role }),
      });
      login(data);
      router.push(getPostAuthPath(data.user));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
    }
  }

  if (!clientId) {
    return (
      <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
        Google sign-in is not configured. Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to .env.local
      </p>
    );
  }

  const isAuth = variant === 'auth';

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className={
          isAuth
            ? 'google-sign-in-auth w-full min-h-[44px]'
            : 'flex w-full justify-center'
        }
      >
        <GoogleLogin
          text="continue_with"
          shape={isAuth ? 'pill' : 'rectangular'}
          theme="outline"
          size="large"
          logo_alignment="left"
          width={btnWidth}
          onSuccess={(res) => handleSuccess(res.credential)}
          onError={() => setError('Google sign-in was cancelled or failed')}
        />
      </div>
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
