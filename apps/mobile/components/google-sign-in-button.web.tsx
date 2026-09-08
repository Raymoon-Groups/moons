'use client';

import { GoogleLogin } from '@react-oauth/google';
import { useEffect, useState } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { UserRole } from '@moons/shared';
import { router } from 'expo-router';
import { ApiError, googleAuthRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { getPostAuthPath } from '@/lib/auth-redirect';
import { GOOGLE_CLIENT_ID } from '@/lib/config';
import { ErrorText } from './ui';

export function GoogleSignInButton({ role = UserRole.CANDIDATE }: { role?: UserRole }) {
  const { signIn } = useAuth();
  const { width: windowWidth } = useWindowDimensions();
  const [error, setError] = useState('');
  const [buttonWidth, setButtonWidth] = useState(320);

  useEffect(() => {
    // Match form content width (screen minus card padding) for a full-bleed pill.
    setButtonWidth(Math.min(420, Math.max(280, windowWidth - 64)));
  }, [windowWidth]);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <ErrorText>Add EXPO_PUBLIC_GOOGLE_CLIENT_ID to apps/mobile/.env for Google sign-in.</ErrorText>
    );
  }

  async function handleSuccess(idToken: string | undefined) {
    if (!idToken) {
      setError('Google sign-in failed — no token received');
      return;
    }
    setError('');
    try {
      const data = await googleAuthRequest(idToken, role);
      await signIn(data);
      router.replace(getPostAuthPath(data.user) as never);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Google sign-in failed');
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={[styles.buttonShell, { width: buttonWidth }]}>
        <GoogleLogin
          text="continue_with"
          shape="pill"
          theme="outline"
          size="large"
          width={String(buttonWidth)}
          onSuccess={(res) => handleSuccess(res.credential)}
          onError={() => setError('Google sign-in was cancelled or failed')}
        />
      </View>
      {error ? <ErrorText>{error}</ErrorText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignItems: 'stretch',
  },
  buttonShell: {
    alignSelf: 'center',
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
});
