import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { UserRole } from '@moons/shared';
import { router } from 'expo-router';
import { ApiError, googleAuthRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { getPostAuthPath } from '@/lib/auth-redirect';
import {
  GOOGLE_ANDROID_CLIENT_ID,
  GOOGLE_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
} from '@/lib/config';
import { isExpoGo } from '@/lib/expo-runtime';
import { signInWithNativeGoogle } from '@/lib/google-sign-in-native';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';
import { ErrorText } from './ui';

WebBrowser.maybeCompleteAuthSession();

type GoogleSignInButtonProps = { role?: UserRole };

const useNativeAndroidGoogleSignIn = Platform.OS === 'android' && !isExpoGo;

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
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
    buttonDisabled: { opacity: 0.55 },
    buttonText: {
      color: colors.heading,
      ...fontStyle('bold'),
      fontSize: 15,
    },
    hint: {
      fontSize: 12,
      color: colors.muted,
      lineHeight: 18,
      marginTop: 10,
    },
    warning: {
      fontSize: 12,
      color: colors.warning,
      lineHeight: 18,
    },
  });
}

function getGoogleRedirectUri() {
  if (Platform.OS === 'web') {
    return AuthSession.makeRedirectUri();
  }
  if (isExpoGo) {
    const packageName =
      Platform.OS === 'android'
        ? 'host.exp.exponent'
        : (Constants.expoConfig?.ios?.bundleIdentifier ?? 'host.exp.Exponent');
    return AuthSession.makeRedirectUri({
      native: `${packageName}:/oauthredirect`,
    });
  }
  return AuthSession.makeRedirectUri({ scheme: 'moonsjob', path: 'oauth' });
}

function getGoogleAuthRequestConfig(redirectUri: string) {
  const webId = GOOGLE_CLIENT_ID || undefined;
  const androidId = GOOGLE_ANDROID_CLIENT_ID || webId;
  const iosId = GOOGLE_IOS_CLIENT_ID || webId;

  return {
    webClientId: webId,
    clientId: webId,
    androidClientId: Platform.OS === 'android' ? androidId : undefined,
    iosClientId: Platform.OS === 'ios' ? iosId : undefined,
    redirectUri,
  };
}

async function completeGoogleAuth(
  idToken: string,
  role: UserRole,
  signIn: ReturnType<typeof useAuth>['signIn'],
  setError: (message: string) => void,
  setLoading: (value: boolean) => void,
) {
  setLoading(true);
  setError('');
  try {
    const data = await googleAuthRequest(idToken, role);
    await signIn(data);
    router.replace(getPostAuthPath(data.user) as never);
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Google sign-in failed';
    setError(
      message === 'Invalid Google token' || message === 'Unauthorized'
        ? 'Server rejected the Google token. Ensure GOOGLE_CLIENT_ID is set on the API and restart it.'
        : message,
    );
  } finally {
    setLoading(false);
  }
}

function GoogleSignInButtonNative({ role = UserRole.CANDIDATE }: GoogleSignInButtonProps) {
  const { signIn } = useAuth();
  const { colors } = useTheme();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [authReady, setAuthReady] = useState(useNativeAndroidGoogleSignIn);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const redirectUri = useMemo(() => getGoogleRedirectUri(), []);
  const googleConfig = useMemo(
    () => getGoogleAuthRequestConfig(redirectUri),
    [redirectUri],
  );

  const [request, response, promptAsync] = Google.useAuthRequest(googleConfig);

  useEffect(() => {
    if (useNativeAndroidGoogleSignIn) return;
    const timer = setTimeout(() => setAuthReady(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (useNativeAndroidGoogleSignIn || !response) return;

    if (response.type === 'error') {
      const message = response.error?.message ?? '';
      setError(
        message.toLowerCase().includes('unauthorized')
          ? 'Google blocked sign-in. Add an Android OAuth client in Google Cloud Console and set EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID in apps/mobile/.env.'
          : message || 'Google sign-in failed.',
      );
      return;
    }

    if (response.type === 'cancel' || response.type === 'dismiss') return;
    if (response.type !== 'success') return;

    (async () => {
      const idToken = response.authentication?.idToken;
      if (!idToken) {
        setError('Google sign-in failed — no token received');
        return;
      }

      await completeGoogleAuth(idToken, role, signIn, setError, setLoading);
    })();
  }, [response, role, signIn]);

  async function handlePress() {
    setError('');

    if (useNativeAndroidGoogleSignIn) {
      setLoading(true);
      const result = await signInWithNativeGoogle();
      if ('cancelled' in result) {
        setLoading(false);
        return;
      }
      if ('error' in result) {
        setError(result.error);
        setLoading(false);
        return;
      }

      await completeGoogleAuth(result.idToken, role, signIn, setError, setLoading);
      return;
    }

    if (!request) {
      setError(
        authReady
          ? 'Google sign-in could not start. Restart Expo after changing .env.'
          : 'Preparing Google sign-in…',
      );
      return;
    }

    try {
      await promptAsync();
    } catch {
      setError('Could not open Google sign-in. Try again.');
    }
  }

  const disabled = loading || (!useNativeAndroidGoogleSignIn && !request && !authReady);
  const usingWebClientOnAndroid =
    Platform.OS === 'android' && !GOOGLE_ANDROID_CLIENT_ID && Boolean(GOOGLE_CLIENT_ID);

  return (
    <View>
      <Pressable
        onPress={() => void handlePress()}
        disabled={disabled}
        style={({ pressed }) => [
          styles.button,
          disabled && styles.buttonDisabled,
          pressed && !disabled && { opacity: 0.9 },
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
      {usingWebClientOnAndroid && !error ? (
        <Text style={styles.hint}>
          For reliable Google sign-in on Android, create an Android OAuth client (package{' '}
          {isExpoGo ? 'host.exp.exponent' : 'com.moonsjob.app'}) and set
          EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID in apps/mobile/.env.
        </Text>
      ) : null}
    </View>
  );
}

export function GoogleSignInButton({ role = UserRole.CANDIDATE }: GoogleSignInButtonProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <Text style={styles.warning}>
        Add EXPO_PUBLIC_GOOGLE_CLIENT_ID to apps/mobile/.env (same Web client ID as the website).
      </Text>
    );
  }

  return <GoogleSignInButtonNative role={role} />;
}
