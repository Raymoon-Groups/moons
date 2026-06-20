'use client';

import { GoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { UserRole } from '@moons/shared';
import { router } from 'expo-router';
import { ApiError, googleAuthRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { getPostAuthPath } from '@/lib/auth-redirect';
import { GOOGLE_CLIENT_ID } from '@/lib/config';
import { ErrorText } from './ui';

export function GoogleSignInButton({ role = UserRole.CANDIDATE }: { role?: UserRole }) {
  const { signIn } = useAuth();
  const [error, setError] = useState('');

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
      <GoogleLogin
        text="continue_with"
        shape="pill"
        theme="outline"
        size="large"
        onSuccess={(res) => handleSuccess(res.credential)}
        onError={() => setError('Google sign-in was cancelled or failed')}
      />
      {error ? <ErrorText>{error}</ErrorText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignItems: 'center',
  },
});
