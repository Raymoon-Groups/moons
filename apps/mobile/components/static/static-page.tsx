import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export function StaticPageScreen({
  eyebrow,
  title,
  subtitle,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  updated?: string;
  children: ReactNode;
}) {
  const { colors, isDark } = useTheme();
  const gradient = isDark
    ? (['#3568b8', '#4a7fd4', '#2d5aa8'] as const)
    : (['#4a7fd4', '#5b8fd9', '#3568b8'] as const);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient colors={gradient} style={styles.hero}>
        <Text style={[styles.eyebrow, fontStyle('semibold')]}>{eyebrow}</Text>
        <Text style={[styles.title, fontStyle('bold')]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, fontStyle('regular')]}>{subtitle}</Text> : null}
        {updated ? (
          <View style={styles.updatedPill}>
            <Text style={[styles.updatedText, fontStyle('medium')]}>Last updated: {updated}</Text>
          </View>
        ) : null}
      </LinearGradient>

      <View style={styles.sections}>{children}</View>

      <View style={[styles.cta, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
        <Text style={[styles.ctaTitle, { color: colors.heading }, fontStyle('bold')]}>Ready to take the next step?</Text>
        <Text style={[styles.ctaSubtitle, { color: colors.muted }, fontStyle('regular')]}>
          Explore opportunities or reach out to our team — we&apos;re here to help.
        </Text>
        <View style={styles.ctaActions}>
          <Pressable
            onPress={() => router.push('/(tabs)/jobs' as never)}
            style={[styles.ctaPrimary, { backgroundColor: colors.blue }]}
          >
            <Text style={[styles.ctaPrimaryText, fontStyle('semibold')]}>Browse jobs</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/contact' as never)}
            style={[styles.ctaSecondary, { borderColor: colors.border }]}
          >
            <Text style={[styles.ctaSecondaryText, { color: colors.heading }, fontStyle('semibold')]}>Contact us</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

export function StaticSection({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.section, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
      <Text style={[styles.sectionHeading, { color: colors.heading }, fontStyle('bold')]}>{heading}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

export function StaticParagraph({ children }: { children: string }) {
  const { colors } = useTheme();
  return <Text style={[styles.paragraph, { color: colors.muted }, fontStyle('regular')]}>{children}</Text>;
}

export function StaticBulletList({ items }: { items: string[] }) {
  const { colors } = useTheme();
  return (
    <View style={styles.bulletList}>
      {items.map((item) => (
        <View key={item} style={styles.bulletRow}>
          <Text style={[styles.bullet, { color: colors.blue }]}>•</Text>
          <Text style={[styles.bulletText, { color: colors.muted }, fontStyle('regular')]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export function StaticEmailLink({ email }: { email: string }) {
  const { colors } = useTheme();
  return (
    <Text style={[styles.email, { color: colors.blue }, fontStyle('semibold')]}>{email}</Text>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing.md, paddingBottom: 40 },
  hero: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  eyebrow: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 999,
    color: '#fff',
    fontSize: 11,
    letterSpacing: 0.6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    textTransform: 'uppercase',
  },
  title: {
    color: '#fff',
    fontSize: 26,
    lineHeight: 32,
    marginTop: 12,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
  },
  updatedPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 999,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  updatedText: { color: 'rgba(255,255,255,0.85)', fontSize: 11 },
  sections: { gap: 12 },
  section: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: theme.spacing.md,
  },
  sectionHeading: { fontSize: 17, marginBottom: 10 },
  sectionBody: { gap: 10 },
  paragraph: { fontSize: 15, lineHeight: 22 },
  bulletList: { gap: 8 },
  bulletRow: { flexDirection: 'row', gap: 8 },
  bullet: { fontSize: 16, lineHeight: 22 },
  bulletText: { flex: 1, fontSize: 15, lineHeight: 22 },
  email: { fontSize: 15 },
  cta: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    marginTop: theme.spacing.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  ctaTitle: { fontSize: 18, textAlign: 'center' },
  ctaSubtitle: { fontSize: 14, lineHeight: 20, marginTop: 8, textAlign: 'center' },
  ctaActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 16 },
  ctaPrimary: { borderRadius: 999, paddingHorizontal: 20, paddingVertical: 12 },
  ctaPrimaryText: { color: '#fff', fontSize: 14 },
  ctaSecondary: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 20, paddingVertical: 12 },
  ctaSecondaryText: { fontSize: 14 },
});
