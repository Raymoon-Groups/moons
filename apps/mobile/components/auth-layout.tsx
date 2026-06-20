import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MoonsLogo } from './moons-logo';
import { ThemeToggle } from './theme-toggle';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export function AuthLayout({
  title,
  subtitle,
  footer,
  children,
}: {
  title: string;
  subtitle: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, backgroundColor: colors.background },
        hero: {
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: 36,
        },
        heroTop: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        },
        heroTitle: {
          marginTop: theme.spacing.lg,
          fontSize: 28,
          fontFamily: theme.fonts.extrabold,
          color: colors.white,
          lineHeight: 36,
        },
        heroSubtitle: {
          marginTop: theme.spacing.sm,
          fontSize: 15,
          lineHeight: 23,
          fontFamily: theme.fonts.regular,
          color: 'rgba(255,255,255,0.88)',
        },
        formArea: { flex: 1, marginTop: -28 },
        scroll: { paddingHorizontal: theme.spacing.md, flexGrow: 1 },
        card: {
          backgroundColor: colors.surfaceElevated,
          borderRadius: theme.radius.xl,
          borderWidth: 1,
          borderColor: colors.border,
          padding: theme.spacing.lg,
          ...theme.shadow.card,
        },
        title: {
          fontSize: 26,
          fontFamily: theme.fonts.extrabold,
          color: colors.heading,
        },
        subtitle: {
          marginTop: theme.spacing.sm,
          fontSize: 15,
          lineHeight: 22,
          fontFamily: theme.fonts.regular,
          color: colors.muted,
        },
        body: { marginTop: theme.spacing.lg },
        footer: {
          marginTop: theme.spacing.lg,
          alignItems: 'center',
        },
      }),
    [colors],
  );

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#3568b8', '#4a7fd4', '#1a2744']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.heroTop}>
          <MoonsLogo size="lg" variant="onDark" />
          <ThemeToggle />
        </View>
        <Text style={styles.heroTitle}>Find jobs faster.{'\n'}Apply smarter.</Text>
        <Text style={styles.heroSubtitle}>
          Browse openings, build your profile, and connect with top recruiters across India.
        </Text>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.formArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 28 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
            <View style={styles.body}>{children}</View>
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
