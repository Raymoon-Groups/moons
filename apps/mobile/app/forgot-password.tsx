import { router } from 'expo-router';
import { useState, useMemo } from 'react';
import { Text, StyleSheet } from 'react-native';
import { AuthLayout } from '@/components/auth-layout';
import {
  ErrorText,
  FieldLabel,
  InfoText,
  Input,
  LinkText,
  PrimaryButton,
  SecondaryButton,
} from '@/components/ui';
import { ApiError, forgotPasswordRequest, resetPasswordRequest } from '@/lib/api';
import { useTheme } from '@/lib/theme-context';

type Step = 'email' | 'reset';

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        hint: { color: colors.muted, fontSize: 14, marginBottom: 8 },
      }),
    [colors],
  );

  async function handleSendReset() {
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const res = await forgotPasswordRequest(email.trim());
      setInfo(res.message);
      setStep('reset');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    setError('');
    setLoading(true);
    try {
      await resetPasswordRequest(email.trim(), otp.trim(), password, confirmPassword);
      router.replace('/login?reset=success' as never);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We'll send a verification code to your email."
      footer={<LinkText onPress={() => router.push('/login')}>Back to login</LinkText>}
    >
      {step === 'email' ? (
        <>
          <FieldLabel>Email</FieldLabel>
          <Input
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@email.com"
          />
          {error ? <ErrorText>{error}</ErrorText> : null}
          {info ? <InfoText>{info}</InfoText> : null}
          <PrimaryButton
            label={loading ? 'Sending…' : 'Send reset code'}
            onPress={handleSendReset}
            loading={loading}
          />
        </>
      ) : (
        <>
          <Text style={styles.hint}>Enter the code sent to {email}</Text>
          <FieldLabel>Verification code</FieldLabel>
          <Input value={otp} onChangeText={setOtp} keyboardType="number-pad" placeholder="123456" />
          <FieldLabel>New password</FieldLabel>
          <Input value={password} onChangeText={setPassword} secureTextEntry placeholder="New password" />
          <FieldLabel>Confirm password</FieldLabel>
          <Input
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="Confirm password"
          />
          {error ? <ErrorText>{error}</ErrorText> : null}
          <PrimaryButton
            label={loading ? 'Resetting…' : 'Reset password'}
            onPress={handleResetPassword}
            loading={loading}
          />
          <SecondaryButton label="Back" onPress={() => setStep('email')} />
        </>
      )}
    </AuthLayout>
  );
}

