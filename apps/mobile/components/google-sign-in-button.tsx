import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
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
import { useAuthSurface } from '@/components/auth-layout';
import { ErrorText } from './ui';

WebBrowser.maybeCompleteAuthSession();

type GoogleSignInButtonProps = { role?: UserRole };

const useNativeAndroidGoogleSignIn = Platform.OS === 'android' && !isExpoGo;

function GoogleMark({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <Path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <Path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <Path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </Svg>
  );
}

function createStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  onDark: boolean,
) {
  return StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      minHeight: 56,
      borderWidth: 1,
      borderColor: onDark ? 'rgba(255,255,255,0.22)' : '#DADCE0',
      borderRadius: theme.radius.full,
      paddingVertical: 16,
      paddingHorizontal: 22,
      backgroundColor: onDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF',
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: onDark ? 0 : 0.08,
      shadowRadius: 10,
      elevation: onDark ? 0 : 3,
    },
    buttonDisabled: { opacity: 0.55 },
    buttonText: {
      color: onDark ? '#F5F8FF' : '#3C4043',
      ...fontStyle('semibold'),
      fontSize: 16,
      letterSpacing: 0.15,
    },
    hint: {
      fontSize: 12,
      color: onDark ? 'rgba(214,224,240,0.7)' : colors.muted,
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
  const surface = useAuthSurface();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [authReady, setAuthReady] = useState(useNativeAndroidGoogleSignIn);
  const styles = useMemo(
    () => createStyles(colors, surface === 'dark'),
    [colors, surface],
  );

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
          pressed && !disabled && { opacity: 0.92, transform: [{ scale: 0.985 }] },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={surface === 'dark' ? '#F5F8FF' : '#3C4043'} />
        ) : (
          <>
            {surface === 'dark' ? (
              <Ionicons name="logo-google" size={22} color="#F5F8FF" />
            ) : (
              <GoogleMark size={22} />
            )}
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
  const surface = useAuthSurface();
  const styles = useMemo(
    () => createStyles(colors, surface === 'dark'),
    [colors, surface],
  );

  if (!GOOGLE_CLIENT_ID) {
    return (
      <Text style={styles.warning}>
        Add EXPO_PUBLIC_GOOGLE_CLIENT_ID to apps/mobile/.env (same Web client ID as the website).
      </Text>
    );
  }

  return <GoogleSignInButtonNative role={role} />;
}
