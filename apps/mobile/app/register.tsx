import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  UserRole,
  getPasswordValidationErrors,
  isRecruiterCompanyEmail,
  PASSWORD_REQUIREMENTS_MESSAGE,
  RECRUITER_COMPANY_EMAIL_MESSAGE,
} from '@moons/shared';
import { AuthField, AuthLayout, AuthPasswordField } from '@/components/auth-layout';
import { GoogleSignInButton } from '@/components/google-sign-in-button';
import { RolePicker } from '@/components/role-picker';
import {
  Divider,
  ErrorText,
  FieldLabel,
  InfoText,
  LinkText,
  PrimaryButton,
  SecondaryButton,
} from '@/components/ui';
import { ApiError, NetworkError, resendRegisterOtp, sendRegisterOtp, verifyRegisterOtp } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { getPostAuthPath } from '@/lib/auth-redirect';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';

type Step = 'credentials' | 'otp';

export default function RegisterScreen() {
  const { signIn } = useAuth();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ role?: string }>();
  const defaultRole = params.role === 'recruiter' ? UserRole.RECRUITER : UserRole.CANDIDATE;

  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [role, setRole] = useState(defaultRole);
  const [error, setError] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        otpHint: {
          color: colors.muted,
          fontSize: 12,
          marginTop: -2,
          marginBottom: 12,
          lineHeight: 18,
        },
        legal: {
          color: colors.muted,
          fontSize: 12,
          lineHeight: 18,
          textAlign: 'center',
          marginBottom: 4,
          ...fontStyle('regular'),
        },
        footer: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
        footerText: { color: colors.muted, fontSize: 14 },
      }),
    [colors],
  );

  async function handleSendOtp() {
    setError('');
    setPasswordErrors([]);
    setInfo('');
    if (role === UserRole.RECRUITER && !isRecruiterCompanyEmail(email.trim())) {
      setError(RECRUITER_COMPANY_EMAIL_MESSAGE);
      return;
    }
    const nextPasswordErrors = getPasswordValidationErrors(password);
    if (nextPasswordErrors.length > 0) {
      setPasswordErrors(nextPasswordErrors);
      return;
    }
    setLoading(true);
    try {
      const res = await sendRegisterOtp(email.trim(), password, role);
      setInfo(res.message);
      setStep('otp');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'GOOGLE_ACCOUNT_EXISTS') {
        setError('An account with this email already exists. Please sign in with Google instead.');
      } else if (err instanceof ApiError && err.code === 'ACCOUNT_EXISTS') {
        setError('Account already exists. Please log in instead.');
      } else {
        setError(
          err instanceof NetworkError
            ? err.message
            : err instanceof ApiError
              ? err.message
              : 'Failed to send verification code',
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const res = await resendRegisterOtp(email.trim());
      setInfo(res.message);
    } catch (err) {
      setError(
        err instanceof NetworkError
          ? err.message
          : err instanceof ApiError
            ? err.message
            : 'Failed to resend code',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    setError('');
    setLoading(true);
    try {
      const data = await verifyRegisterOtp(email.trim(), otp.trim());
      await signIn(data);
      router.replace(getPostAuthPath(data.user) as never);
    } catch (err) {
      setError(
        err instanceof NetworkError
          ? err.message
          : err instanceof ApiError
            ? err.message
            : 'Verification failed',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      variant="signup"
      title={step === 'credentials' ? 'Create account' : 'Verify email'}
      subtitle={
        step === 'credentials'
          ? 'Join MoonsJob to apply faster and connect with top teams.'
          : `Enter the 6-digit code sent to ${email}`
      }
      footer={
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <LinkText onPress={() => router.push('/login')}>Sign in</LinkText>
        </View>
      }
    >
      {step === 'credentials' ? (
        <>
          <FieldLabel>Continue as</FieldLabel>
          <RolePicker value={role} onChange={setRole} />
          <GoogleSignInButton role={role} />

          <Divider label="or continue with email" />

          <AuthField
            icon="mail-outline"
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Your email"
          />

          <AuthPasswordField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Create a password"
          />

          <Text style={styles.otpHint}>{PASSWORD_REQUIREMENTS_MESSAGE}</Text>

          {passwordErrors.length > 0 ? (
            <ErrorText>{passwordErrors.map((item) => `• ${item}`).join('\n')}</ErrorText>
          ) : null}
          {error ? <ErrorText>{error}</ErrorText> : null}
          {info ? <InfoText>{info}</InfoText> : null}

          <PrimaryButton
            label={loading ? 'Sending code…' : 'Create account'}
            onPress={handleSendOtp}
            loading={loading}
          />

          <Text style={styles.legal}>
            By signing up, you agree to our Terms & Conditions and Privacy Policy.
          </Text>
        </>
      ) : (
        <>
          <AuthField
            icon="keypad-outline"
            label="Verification code"
            value={otp}
            onChangeText={(text) => setOtp(text.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            placeholder="6-digit code"
            maxLength={6}
          />
          {error ? <ErrorText>{error}</ErrorText> : null}
          {info ? <InfoText>{info}</InfoText> : null}
          <PrimaryButton
            label={loading ? 'Verifying…' : 'Verify & create account'}
            onPress={handleVerifyOtp}
            loading={loading}
          />
          <SecondaryButton label="Resend code" onPress={handleResendOtp} />
          <SecondaryButton label="Back" onPress={() => setStep('credentials')} />
        </>
      )}
    </AuthLayout>
  );
}
