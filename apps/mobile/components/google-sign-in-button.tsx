import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { UserRole } from '@moons/shared';
import { router } from 'expo-router';
import { ApiError, googleAuthRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { getPostAuthPath } from '@/lib/auth-redirect';
import { GOOGLE_CLIENT_ID } from '@/lib/config';
import { isExpoGo } from '@/lib/expo-runtime';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';
import { ErrorText } from './ui';

WebBrowser.maybeCompleteAuthSession();

const redirectUri = AuthSession.makeRedirectUri({
  scheme: 'moonsjob',
  path: 'oauth',
});

export function GoogleSignInButton({ role = UserRole.CANDIDATE }: { role?: UserRole }) {
  const { signIn } = useAuth();
  const { colors } = useTheme();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        button: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: theme.radius.full,
          paddingVertical: 14,
          backgroundColor: colors.surface,
        },
        buttonDisabled: { opacity: 0.6 },
        buttonText: {
          color: colors.heading,
          ...fontStyle('bold'),
          fontSize: 15,
        },
        notice: {
          fontSize: 13,
          color: colors.muted,
          lineHeight: 19,
          marginBottom: 10,
        },
        warning: {
          fontSize: 12,
          color: colors.warning,
          lineHeight: 18,
        },
      }),
    [colors],
  );

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_CLIENT_ID || undefined,
    androidClientId: GOOGLE_CLIENT_ID || undefined,
    iosClientId: GOOGLE_CLIENT_ID || undefined,
    redirectUri,
  });

  useEffect(() => {
    if (!response) return;

    if (response.type === 'error') {
      setError(
        response.error?.message ??
          'Google sign-in failed. Google OAuth does not work in Expo Go — use email sign-in.',
      );
      return;
    }

    if (response.type === 'cancel' || response.type === 'dismiss') {
      return;
    }

    if (response.type !== 'success') return;

    (async () => {
      const idToken = response.authentication?.idToken;
      if (!idToken) {
        setError('Google sign-in failed — no token received');
        return;
      }

      setLoading(true);
      setError('');
      try {
        const data = await googleAuthRequest(idToken, role);
        await signIn(data);
        router.replace(getPostAuthPath(data.user) as never);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Google sign-in failed');
      } finally {
        setLoading(false);
      }
    })();
  }, [response, role, signIn]);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <Text style={styles.warning}>
        Add EXPO_PUBLIC_GOOGLE_CLIENT_ID to apps/mobile/.env for Google sign-in.
      </Text>
    );
  }

  if (isExpoGo) {
    return (
      <View>
        <Text style={styles.notice}>
          Google sign-in is not available in Expo Go. Use email and password above to test on your
          phone. Google works on the website and in a production/dev build of the app.
        </Text>
        <Pressable disabled style={[styles.button, styles.buttonDisabled]}>
          <Ionicons name="logo-google" size={18} color={colors.muted} />
          <Text style={[styles.buttonText, { color: colors.muted }]}>Continue with Google</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View>
      <Pressable
        onPress={() => {
          setError('');
          promptAsync();
        }}
        disabled={!request || loading}
        style={({ pressed }) => [
          styles.button,
          (!request || loading) && styles.buttonDisabled,
          pressed && { opacity: 0.9 },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={colors.heading} />
        ) : (
          <>
            <Ionicons name="logo-google" size={18} color={colors.heading} />
            <Text style={styles.buttonText}>Continue with Google</Text>
          </>
        )}
      </Pressable>
      {error ? <ErrorText>{error}</ErrorText> : null}
    </View>
  );
}
