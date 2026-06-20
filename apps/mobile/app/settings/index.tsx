import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export default function SettingsScreen() {
  const { colors } = useTheme();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.heading, { color: colors.muted }, fontStyle('bold')]}>Account</Text>

      <MenuLink
        label="Edit profile"
        subtitle="Photo, resume, experience & more"
        onPress={() => router.push('/profile/edit')}
        colors={colors}
      />
      <MenuLink
        label="Security"
        subtitle="Password & sign-in methods"
        onPress={() => router.push('/settings/security')}
        colors={colors}
      />
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
  subtitle: string;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
    >
      <Text style={[styles.label, { color: colors.heading }, fontStyle('bold')]}>{label}</Text>
      <Text style={[styles.subtitle, { color: colors.muted }, fontStyle('regular')]}>{subtitle}</Text>
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
});
