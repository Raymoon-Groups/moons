import { type ReactNode } from 'react';
import { Platform } from 'react-native';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GOOGLE_CLIENT_ID } from '@/lib/config';

export function GoogleAuthWrapper({ children }: { children: ReactNode }) {
  if (Platform.OS === 'web' && GOOGLE_CLIENT_ID) {
    return <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{children}</GoogleOAuthProvider>;
  }
  return children;
}
