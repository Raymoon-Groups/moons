import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';
import { apiFetch, ApiError } from '@/lib/api';
import { Input, PrimaryButton } from '@/components/ui';

const LEGAL_LINKS = [
  { label: 'About', route: '/about' },
  { label: 'Contact us', route: '/contact' },
  { label: 'Terms & conditions', route: '/terms' },
  { label: 'Privacy policy', route: '/privacy' },
  { label: 'Fraud alert', route: '/fraud-alert' },
] as const;

export default function SettingsScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newsletterError, setNewsletterError] = useState('');

  async function handleSubscribe() {
    const trimmed = email.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setNewsletterError('');
    try {
      await apiFetch<{ success: boolean; message: string }>('/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({ email: trimmed }),
      });
      setSubscribed(true);
      setEmail('');
    } catch (err) {
      setNewsletterError(err instanceof ApiError ? err.message : 'Subscription failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.heading, { color: colors.muted }, fontStyle('bold')]}>Account</Text>

      <MenuLink
        label="Edit profile"
        subtitle="Photo, resume, experience & more"
        onPress={() => router.push('/profile/edit')}
        colors={colors}
      />
      <MenuLink
        label="My network"
        subtitle="Connections, pending requests & visitors"
        onPress={() => router.push('/profile/network')}
        colors={colors}
      />
      <MenuLink
        label="Security"
        subtitle="Password & sign-in methods"
        onPress={() => router.push('/settings/security')}
        colors={colors}
      />

      <Text style={[styles.heading, { color: colors.muted, marginTop: 8 }, fontStyle('bold')]}>Company</Text>
      {LEGAL_LINKS.map((link) => (
        <MenuLink
          key={link.route}
          label={link.label}
          onPress={() => router.push(link.route as never)}
          colors={colors}
        />
      ))}

      <View style={[styles.newsletter, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
        <Text style={[{ color: colors.heading, fontSize: 16 }, fontStyle('bold')]}>Job alerts & updates</Text>
        <Text style={[{ color: colors.muted, fontSize: 13, marginTop: 6, lineHeight: 19 }, fontStyle('regular')]}>
          Subscribe to get the latest jobs and platform news in your inbox.
        </Text>
        {subscribed ? (
          <Text style={[{ color: colors.blue, fontSize: 13, marginTop: 12 }, fontStyle('semibold')]}>
            Thanks for subscribing!
          </Text>
        ) : (
          <>
            <View style={{ marginTop: 12 }}>
              <Input
                value={email}
                onChangeText={setEmail}
                placeholder="you@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {newsletterError ? (
              <Text style={[{ color: colors.error, fontSize: 12, marginTop: 8 }, fontStyle('medium')]}>{newsletterError}</Text>
            ) : null}
            <View style={{ marginTop: 12 }}>
              <PrimaryButton
                label={submitting ? 'Subscribing…' : 'Subscribe'}
                onPress={() => void handleSubscribe()}
                loading={submitting}
              />
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

function MenuLink({
  label,
  subtitle,
  onPress,
  colors,
}: {
  label: string;
  subtitle?: string;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
    >
      <Text style={[styles.label, { color: colors.heading }, fontStyle('bold')]}>{label}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.muted }, fontStyle('regular')]}>{subtitle}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing.md, paddingBottom: 32 },
  heading: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: theme.spacing.md,
    marginBottom: 12,
  },
  label: { fontSize: 16 },
  subtitle: { marginTop: 4, fontSize: 13 },
  newsletter: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    marginTop: 8,
    padding: theme.spacing.md,
  },
});
