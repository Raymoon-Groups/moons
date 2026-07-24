import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState, useMemo } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { UserRole } from '@moons/shared';
import { AuthLayout } from '@/components/auth-layout';
import { GoogleSignInButton } from '@/components/google-sign-in-button';
import { RolePicker } from '@/components/role-picker';
import {
  Divider,
  ErrorText,
  FieldLabel,
  InfoText,
  Input,
  LinkText,
  PasswordInput,
  PrimaryButton,
} from '@/components/ui';
import { ApiError, NetworkError } from '@/lib/api';
import { API_URL } from '@/lib/api-url';
import { checkApiReachable } from '@/lib/api-health';
import { useAuth } from '@/lib/auth-context';
import { getPostAuthPath } from '@/lib/auth-redirect';
import { useTheme } from '@/lib/theme-context';

export default function LoginScreen() {
  const { login } = useAuth();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ role?: string; reset?: string }>();
  const defaultRole = params.role === 'recruiter' ? UserRole.RECRUITER : UserRole.CANDIDATE;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [googleRole, setGoogleRole] = useState(defaultRole);
  const [error, setError] = useState('');
  const [isGoogleAccount, setIsGoogleAccount] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    void checkApiReachable().then((ok) => {
      if (active) setApiOnline(ok);
    });
    return () => {
      active = false;
    };
  }, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        forgotRow: { alignItems: 'flex-end', marginTop: 4 },
        googleHint: { marginTop: 8, fontSize: 13, lineHeight: 18, color: colors.warning },
        apiBanner: {
          backgroundColor: colors.errorBg,
          borderRadius: 12,
          padding: 12,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: `${colors.error}33`,
        },
        apiBannerText: { color: colors.error, fontSize: 13, lineHeight: 19 },
        apiBannerHint: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 6 },
        footer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
        footerText: { color: colors.muted, fontSize: 14 },
      }),
    [colors],
  );

  async function handleSubmit() {
    setError('');
    setIsGoogleAccount(false);
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      router.replace(getPostAuthPath(user) as never);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'GOOGLE_ACCOUNT') setIsGoogleAccount(true);
      if (err instanceof NetworkError) {
        setError(err.message);
      } else {
        setError(err instanceof ApiError ? err.message : 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to find jobs, track applications, and manage your profile."
      footer={
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don&apos;t have an account? </Text>
          <LinkText onPress={() => router.push('/register')}>Sign up</LinkText>
        </View>
      }
    >
      {params.reset === 'success' ? <InfoText>Password reset successfully. You can now sign in.</InfoText> : null}

      {apiOnline === false ? (
        <View style={styles.apiBanner}>
          <Text style={styles.apiBannerText}>
            API server is not reachable at {API_URL}
          </Text>
          <Text style={styles.apiBannerHint}>
            {__DEV__
              ? 'Run pnpm api (or pnpm mobile) on your computer, then reload. Phone and PC must be on the same Wi‑Fi.'
              : 'Check your internet connection, then try again. If this keeps happening, the production API may be down.'}
          </Text>
        </View>
      ) : null}

      <FieldLabel>Email</FieldLabel>
      <Input
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="you@email.com"
      />

      <FieldLabel>Password</FieldLabel>
      <PasswordInput value={password} onChangeText={setPassword} placeholder="Your password" />

      <View style={styles.forgotRow}>
        <LinkText onPress={() => router.push('/forgot-password')}>Forgot password?</LinkText>
      </View>

      {error ? <ErrorText>{error}</ErrorText> : null}
      {isGoogleAccount ? (
        <Text style={styles.googleHint}>
          This account uses Google sign-in. Continue with Google below, or add a password in Settings
          after signing in.
        </Text>
      ) : null}

      <PrimaryButton label={loading ? 'Signing in…' : 'Login'} onPress={handleSubmit} loading={loading} />

      <Divider />

      <FieldLabel>I am a</FieldLabel>
      <RolePicker value={googleRole} onChange={setGoogleRole} />
      <GoogleSignInButton role={googleRole} />

    </AuthLayout>
  );
}

