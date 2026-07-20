import { router, useLocalSearchParams } from 'expo-router';
import { useState, useMemo } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { UserRole, getPasswordValidationError, isRecruiterCompanyEmail, PASSWORD_REQUIREMENTS_MESSAGE, RECRUITER_COMPANY_EMAIL_MESSAGE } from '@moons/shared';
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
  SecondaryButton,
} from '@/components/ui';
import { ApiError, NetworkError, resendRegisterOtp, sendRegisterOtp, verifyRegisterOtp } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { getPostAuthPath } from '@/lib/auth-redirect';
import { useTheme } from '@/lib/theme-context';

type Step = 'credentials' | 'otp';

export default function RegisterScreen() {
  const { colors } = useTheme();
  const { signIn } = useAuth();
  const params = useLocalSearchParams<{ role?: string }>();
  const defaultRole = params.role === 'recruiter' ? UserRole.RECRUITER : UserRole.CANDIDATE;

  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [role, setRole] = useState(defaultRole);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        otpHint: { color: colors.muted, fontSize: 14, marginBottom: 8, lineHeight: 20 },
        footer: { flexDirection: 'row', justifyContent: 'center' },
        footerText: { color: colors.muted, fontSize: 14 },
      }),
    [colors],
  );

  async function handleSendOtp() {
    setError('');
    setInfo('');
    if (role === UserRole.RECRUITER && !isRecruiterCompanyEmail(email.trim())) {
      setError(RECRUITER_COMPANY_EMAIL_MESSAGE);
      return;
    }
    const passwordError = getPasswordValidationError(password);
    if (passwordError) {
      setError(passwordError);
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
      title="Create your account"
      subtitle="Register free to browse jobs, apply in one click, and get noticed by recruiters."
      footer={
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already registered? </Text>
          <LinkText onPress={() => router.push('/login')}>Login</LinkText>
        </View>
      }
    >
      {step === 'credentials' ? (
        <>
          <FieldLabel>I am a</FieldLabel>
          <RolePicker value={role} onChange={setRole} />
          <FieldLabel>Email</FieldLabel>
          <Input
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@email.com"
          />
          <FieldLabel>Password</FieldLabel>
          <PasswordInput value={password} onChangeText={setPassword} placeholder="e.g. Welcome@1" />
          <Text style={[styles.otpHint, { marginTop: 6, marginBottom: 0 }]}>
            {PASSWORD_REQUIREMENTS_MESSAGE}
          </Text>          {error ? <ErrorText>{error}</ErrorText> : null}
          {info ? <InfoText>{info}</InfoText> : null}
          <PrimaryButton label={loading ? 'Sending code…' : 'Continue'} onPress={handleSendOtp} loading={loading} />
          <Divider />
          <GoogleSignInButton role={role} />
        </>
      ) : (
        <>
          <Text style={styles.otpHint}>Enter the 6-digit code sent to {email}</Text>
          <FieldLabel>Verification code</FieldLabel>
          <Input
            value={otp}
            onChangeText={(text) => setOtp(text.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            placeholder="123456"
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

