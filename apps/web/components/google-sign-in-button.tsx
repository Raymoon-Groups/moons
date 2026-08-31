'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { UserRole, type AuthResponse } from '@moons/shared';
import { apiFetch } from '@/lib/api-client';
import { getLoginRedirectPath, getPostAuthPath } from '@/lib/auth-redirect';
import { useAuth } from '@/lib/auth-context';
import {
  ensureGoogleGsiInitialized,
  renderGoogleSignInButton,
  subscribeGoogleCredential,
} from '@/lib/google-gsi';

interface GoogleSignInButtonProps {
  role?: UserRole;
  variant?: 'default' | 'auth';
}

export function GoogleSignInButton({
  role = UserRole.CANDIDATE,
  variant = 'default',
}: GoogleSignInButtonProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const buttonHostRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef(role);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const nextPath = searchParams.get('next');

  roleRef.current = role;

  const handleSuccess = useCallback(
    async (idToken: string) => {
      setError('');
      setLoading(true);
      try {
        const data = await apiFetch<AuthResponse>('/auth/google', {
          method: 'POST',
          body: JSON.stringify({ idToken, role: roleRef.current }),
        });
        login(data);
        router.push(
          variant === 'auth'
            ? getLoginRedirectPath(data.user, nextPath)
            : getPostAuthPath(data.user),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Google sign-in failed');
      } finally {
        setLoading(false);
      }
    },
    [login, nextPath, router, variant],
  );

  useEffect(() => subscribeGoogleCredential(handleSuccess), [handleSuccess]);

  useLayoutEffect(() => {
    if (!clientId || !buttonHostRef.current) return;

    const host = buttonHostRef.current;
    const width =
      Math.min(Math.floor(host.getBoundingClientRect().width), 400) || 400;
    const isAuth = variant === 'auth';
    let cancelled = false;

    void (async () => {
      try {
        await ensureGoogleGsiInitialized(clientId);
        if (cancelled) return;

        await renderGoogleSignInButton(host, {
          text: 'continue_with',
          shape: isAuth ? 'pill' : 'rectangular',
          theme: 'outline',
          size: 'large',
          logo_alignment: 'left',
          width,
        });
      } catch {
        if (!cancelled) {
          setError('Failed to load Google Sign-In. Please refresh and try again.');
        }
      }
    })();

    return () => {
      cancelled = true;
      host.replaceChildren();
    };
  }, [clientId, variant]);

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
        ref={buttonHostRef}
        className={
          isAuth
            ? 'google-sign-in-auth w-full min-h-[44px]'
            : 'flex w-full justify-center min-h-[44px]'
        }
      />
      {loading && (
        <p className="text-center text-sm text-moons-muted">Signing in with Google…</p>
      )}
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
