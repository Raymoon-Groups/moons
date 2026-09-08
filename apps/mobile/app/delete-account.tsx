import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  StaticBulletList,
  StaticEmailLink,
  StaticPageScreen,
  StaticParagraph,
  StaticSection,
} from '@/components/static/static-page';
import { ErrorText, FieldLabel, PasswordInput, PrimaryButton } from '@/components/ui';
import { ApiError, authFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export default function DeleteAccountScreen() {
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        formCard: {
          backgroundColor: colors.surfaceElevated,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: theme.spacing.md,
          marginBottom: theme.spacing.md,
        },
        title: { fontSize: 16, ...fontStyle('bold'), color: colors.heading, marginBottom: 8 },
        hint: { fontSize: 13, color: colors.muted, marginBottom: 12, lineHeight: 18 },
        input: {
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: theme.radius.md,
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontSize: 15,
          color: colors.heading,
          backgroundColor: colors.surface,
          marginBottom: 12,
          ...fontStyle('regular'),
        },
      }),
    [colors],
  );

  async function runDelete() {
    setError('');
    if (confirmation !== 'DELETE') {
      setError('Type DELETE in capital letters to confirm.');
      return;
    }
    setLoading(true);
    try {
      await authFetch('/auth/account', {
        method: 'DELETE',
        body: JSON.stringify({
          confirmation,
          ...(user?.hasPassword ? { password } : {}),
        }),
      });
      await logout();
      router.replace('/login');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete account');
      setLoading(false);
    }
  }

  function confirmDelete() {
    Alert.alert(
      'Delete account permanently?',
      'Your profile, resume, applications, messages, and uploaded files will be removed. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => void runDelete() },
      ],
    );
  }

  return (
    <StaticPageScreen
      eyebrow="Account"
      title="Delete your MoonsJob account"
      subtitle="Permanently delete your MoonsJob account and associated personal data."
      updated="8 September 2026"
    >
      {user ? (
        <View style={styles.formCard}>
          <Text style={styles.title}>Delete in the app</Text>
          <Text style={styles.hint}>
            This removes your account immediately. Type DELETE to confirm
            {user.hasPassword ? ' and enter your password' : ''}.
          </Text>
          {user.hasPassword ? (
            <>
              <FieldLabel>Current password</FieldLabel>
              <PasswordInput
                value={password}
                onChangeText={setPassword}
                placeholder="Current password"
              />
            </>
          ) : null}
          <FieldLabel>Type DELETE to confirm</FieldLabel>
          <TextInput
            value={confirmation}
            onChangeText={setConfirmation}
            placeholder="DELETE"
            autoCapitalize="characters"
            autoCorrect={false}
            style={styles.input}
            placeholderTextColor={colors.muted}
          />
          {error ? <ErrorText>{error}</ErrorText> : null}
          <PrimaryButton
            label={loading ? 'Deleting…' : 'Delete my account'}
            onPress={confirmDelete}
            loading={loading}
          />
        </View>
      ) : (
        <StaticSection heading="Sign in required">
          <StaticParagraph>
            Sign in to delete your account from the app, or email privacy@moonsjob.com if you cannot
            access it.
          </StaticParagraph>
          <PrimaryButton label="Go to login" onPress={() => router.push('/login')} />
        </StaticSection>
      )}

      <StaticSection heading="What data is deleted">
        <StaticParagraph>
          When your MoonsJob account is deleted, we remove or irreversibly anonymise:
        </StaticParagraph>
        <StaticBulletList
          items={[
            'Account credentials and login identifiers',
            'Profile information and uploaded files (resume, avatar, banner, logo)',
            'Job applications and jobs you posted',
            'Network connections and profile visit records',
            'Messages, conversations, and notifications',
          ]}
        />
      </StaticSection>

      <StaticSection heading="What data may be retained">
        <StaticBulletList
          items={[
            'Legal / fraud prevention records (typically up to 90 days)',
            'Encrypted backups for a short rotation period (typically up to 30 days)',
            'Aggregated analytics that cannot identify you',
          ]}
        />
      </StaticSection>

      <StaticSection heading="Contact">
        <StaticParagraph>
          Questions: privacy@moonsjob.com or support@moonsjob.com.
        </StaticParagraph>
        <StaticEmailLink email="privacy@moonsjob.com" />
      </StaticSection>
    </StaticPageScreen>
  );
}
