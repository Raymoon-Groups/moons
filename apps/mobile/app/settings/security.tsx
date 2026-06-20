import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, ErrorText, FieldLabel, InfoText, Input, PrimaryButton, Screen } from '@/components/ui';
import { ApiError, authFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export default function SecurityScreen() {
  const { user, updateUser } = useAuth();
  const { colors } = useTheme();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        statusCard: {
          backgroundColor: colors.surfaceElevated,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: theme.spacing.md,
          marginBottom: theme.spacing.md,
        },
        statusTitle: { fontSize: 15, ...fontStyle('bold'), color: colors.heading, marginBottom: 8 },
        statusRow: { fontSize: 14, color: colors.foreground, marginTop: 4 },
        sectionTitle: { fontSize: 16, ...fontStyle('bold'), color: colors.heading, marginBottom: 8 },
        hint: { fontSize: 13, color: colors.muted, marginBottom: 8, lineHeight: 18 },
      }),
    [colors],
  );

  useEffect(() => {
    setError('');
    setInfo('');
  }, [user?.hasPassword]);

  async function handleSetPassword() {
    setError('');
    setInfo('');
    setLoading(true);
    try {
      await authFetch('/auth/set-password', {
        method: 'POST',
        body: JSON.stringify({ password, confirmPassword }),
      });
      if (user) {
        await updateUser({ ...user, hasPassword: true });
      }
      setInfo('Password created successfully.');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to set password');
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword() {
    setError('');
    setInfo('');
    setLoading(true);
    try {
      await authFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword: confirmNewPassword,
        }),
      });
      setInfo('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Sign-in methods</Text>
        <Text style={styles.statusRow}>Email: {user?.email}</Text>
        <Text style={styles.statusRow}>
          Email verified: {user?.emailVerified ? 'Yes' : 'No'}
        </Text>
        <Text style={styles.statusRow}>Password: {user?.hasPassword ? 'Set' : 'Not set'}</Text>
        <Text style={styles.statusRow}>Google: {user?.hasGoogle ? 'Linked' : 'Not linked'}</Text>
      </View>

      <Card>
        {user?.hasPassword ? (
          <>
            <Text style={styles.sectionTitle}>Change password</Text>
            <FieldLabel>Current password</FieldLabel>
            <Input value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
            <FieldLabel>New password</FieldLabel>
            <Input value={newPassword} onChangeText={setNewPassword} secureTextEntry />
            <FieldLabel>Confirm new password</FieldLabel>
            <Input value={confirmNewPassword} onChangeText={setConfirmNewPassword} secureTextEntry />
            <PrimaryButton
              label={loading ? 'Saving…' : 'Change password'}
              onPress={handleChangePassword}
              loading={loading}
            />
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Create a password</Text>
            <Text style={styles.hint}>Add a password so you can also sign in with email.</Text>
            <FieldLabel>Password</FieldLabel>
            <Input value={password} onChangeText={setPassword} secureTextEntry />
            <FieldLabel>Confirm password</FieldLabel>
            <Input value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
            <PrimaryButton
              label={loading ? 'Saving…' : 'Create password'}
              onPress={handleSetPassword}
              loading={loading}
            />
          </>
        )}
        {error ? <ErrorText>{error}</ErrorText> : null}
        {info ? <InfoText>{info}</InfoText> : null}
      </Card>
    </Screen>
  );
}
