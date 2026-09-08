import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import {
  Card,
  ErrorText,
  FieldLabel,
  InfoText,
  PasswordInput,
  PrimaryButton,
  Screen,
  SecondaryButton,
} from '@/components/ui';
import { ApiError, authFetch } from '@/lib/api';
import type { AuthResponse } from '@moons/shared';
import { useAuth } from '@/lib/auth-context';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export default function SecurityScreen() {
  const { user, updateUser, signIn, logout } = useAuth();
  const { colors } = useTheme();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoutAllLoading, setLogoutAllLoading] = useState(false);

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

  async function applySessionTokens(result: {
    user?: AuthResponse['user'];
    accessToken?: string;
    refreshToken?: string;
    message?: string;
  }) {
    if (result.user && result.accessToken) {
      await signIn({
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    }
  }

  async function handleSetPassword() {
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const result = await authFetch<AuthResponse & { success: boolean; message: string }>(
        '/auth/set-password',
        {
          method: 'POST',
          body: JSON.stringify({ password, confirmPassword }),
        },
      );
      await applySessionTokens(result);
      if (user && !result.user) {
        await updateUser({ ...user, hasPassword: true });
      }
      setInfo(result.message || 'Password created successfully. Other devices were signed out.');
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
      const result = await authFetch<AuthResponse & { success: boolean; message: string }>(
        '/auth/change-password',
        {
          method: 'POST',
          body: JSON.stringify({
            currentPassword,
            newPassword,
            confirmPassword: confirmNewPassword,
          }),
        },
      );
      await applySessionTokens(result);
      setInfo(result.message || 'Password changed successfully. Other devices were signed out.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  }

  function confirmLogoutAll() {
    Alert.alert(
      'Sign out all devices',
      'This will sign you out everywhere, including this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out all',
          style: 'destructive',
          onPress: () => void handleLogoutAll(),
        },
      ],
    );
  }

  async function handleLogoutAll() {
    setError('');
    setInfo('');
    setLogoutAllLoading(true);
    try {
      await authFetch('/auth/logout-all', { method: 'POST', body: JSON.stringify({}) });
      await logout();
      router.replace('/login');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to sign out all devices');
      setLogoutAllLoading(false);
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
            <Text style={styles.hint}>This signs out all other devices automatically.</Text>
            <FieldLabel>Current password</FieldLabel>
            <PasswordInput value={currentPassword} onChangeText={setCurrentPassword} placeholder="Current password" />
            <FieldLabel>New password</FieldLabel>
            <PasswordInput value={newPassword} onChangeText={setNewPassword} placeholder="New password" />
            <FieldLabel>Confirm new password</FieldLabel>
            <PasswordInput value={confirmNewPassword} onChangeText={setConfirmNewPassword} placeholder="Confirm new password" />
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
            <PasswordInput value={password} onChangeText={setPassword} placeholder="Password" />
            <FieldLabel>Confirm password</FieldLabel>
            <PasswordInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm password" />
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

      <Card>
        <Text style={styles.sectionTitle}>Sessions</Text>
        <Text style={styles.hint}>
          Sign out everywhere if you think someone else may have access to your account.
        </Text>
        <SecondaryButton
          label={logoutAllLoading ? 'Signing out…' : 'Sign out all devices'}
          onPress={confirmLogoutAll}
          disabled={logoutAllLoading || loading}
        />
      </Card>
    </Screen>
  );
}
