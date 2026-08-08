import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AuthField, AuthLayout, AuthPasswordField } from '@/components/auth-layout';
import {
  ErrorText,
  InfoText,
  LinkText,
  PrimaryButton,
  SecondaryButton,
} from '@/components/ui';
import { ApiError, forgotPasswordRequest, resetPasswordRequest } from '@/lib/api';
import { fontStyle } from '@/lib/font-style';
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
        hint: { color: colors.muted, fontSize: 14, marginBottom: 8, lineHeight: 20 },
        footer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
        footerText: { color: colors.muted, fontSize: 14, ...fontStyle('regular') },
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
      variant="forgot"
      title={step === 'email' ? 'Forget Password' : 'Reset Password'}
      subtitle={
        step === 'email'
          ? "Don't worry, it happens. Please enter the email associated with your MoonsJob account."
          : `Enter the code sent to ${email} and choose a new password.`
      }
      footer={
        <View style={styles.footer}>
          <Text style={styles.footerText}>You remember your password? </Text>
          <LinkText onPress={() => router.push('/login')}>Sign in</LinkText>
        </View>
      }
    >
      {step === 'email' ? (
        <>
          <AuthField
            icon="mail-outline"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Email address"
          />
          {error ? <ErrorText>{error}</ErrorText> : null}
          {info ? <InfoText>{info}</InfoText> : null}
          <PrimaryButton
            label={loading ? 'Sending…' : 'Send OTP'}
            onPress={handleSendReset}
            loading={loading}
          />
        </>
      ) : (
        <>
          <AuthField
            icon="keypad-outline"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            placeholder="Verification code"
          />
          <AuthPasswordField
            value={password}
            onChangeText={setPassword}
            placeholder="New password"
          />
          <AuthPasswordField
            value={confirmPassword}
            onChangeText={setConfirmPassword}
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
