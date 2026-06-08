'use client';

import { GoogleLogin } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import { UserRole, type AuthResponse } from '@moons/shared';
import { apiFetch } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

interface GoogleSignInButtonProps {
  role?: UserRole;
}

export function GoogleSignInButton({ role = UserRole.CANDIDATE }: GoogleSignInButtonProps) {
  const router = useRouter();
  const { login } = useAuth();
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) {
    return (
      <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
        Google sign-in is not configured. Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to
        .env.local
      </p>
    );
  }

  return (
    <div className="flex justify-center [&>div]:w-full">
      <GoogleLogin
        text="continue_with"
        shape="rectangular"
        theme="outline"
        size="large"
        width="360"
        onSuccess={async (credentialResponse) => {
          const idToken = credentialResponse.credential;
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
        }}
        onError={() => {
          alert('Google sign-in was cancelled or failed');
        }}
      />
    </div>
  );
}
