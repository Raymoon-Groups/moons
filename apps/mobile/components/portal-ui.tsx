import { Ionicons } from '@expo/vector-icons';
import { useMemo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export function ScreenHeader({
  title,
  subtitle,
  eyebrow,
  action,
  style,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  action?: ReactNode;
  style?: ViewStyle;
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: { marginBottom: theme.spacing.md },
        row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
        eyebrow: {
          fontSize: 11,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          color: colors.blue,
          marginBottom: 6,
          ...fontStyle('bold'),
        },
        title: { fontSize: 24, lineHeight: 30, color: colors.heading, ...fontStyle('extrabold') },
        subtitle: { marginTop: 6, fontSize: 14, lineHeight: 21, color: colors.muted, ...fontStyle('regular') },
      }),
    [colors],
  );

  return (
    <View style={[styles.wrap, style]}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {action}
      </View>
    </View>
  );
}

export function SectionTitle({ children }: { children: string }) {
  const { colors } = useTheme();
  return (
    <Text
      style={{
        fontSize: 12,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        color: colors.muted,
        marginBottom: 10,
        marginTop: 4,
        ...fontStyle('bold'),
      }}
    >
      {children}
    </Text>
  );
}

export function EmptyState({
  icon,
  title,
  message,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          alignItems: 'center',
          paddingVertical: 48,
          paddingHorizontal: 28,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surfaceElevated,
          marginTop: 8,
        },
        iconWrap: {
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: `${colors.blue}18`,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 14,
        },
        title: { fontSize: 17, color: colors.heading, textAlign: 'center', ...fontStyle('bold') },
        message: {
          marginTop: 8,
          fontSize: 14,
          lineHeight: 21,
          color: colors.muted,
          textAlign: 'center',
          ...fontStyle('regular'),
        },
      }),
    [colors],
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={26} color={colors.blue} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

export function FilterChips({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: theme.spacing.md },
        chip: {
          borderRadius: theme.radius.full,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 14,
          paddingVertical: 8,
          backgroundColor: colors.surface,
        },
        chipActive: {
          borderColor: colors.blue,
          backgroundColor: `${colors.blue}14`,
        },
        text: { fontSize: 13, color: colors.muted, ...fontStyle('semibold') },
        textActive: { color: colors.blue },
      }),
    [colors],
  );

  return (
    <View style={styles.row}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.text, active && styles.textActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function PortalCard({
  children,
  accent,
  onPress,
  style,
}: {
  children: ReactNode;
  accent?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}) {
  const { colors } = useTheme();
  const cardStyle = useMemo(
    () => ({
      backgroundColor: colors.surfaceElevated,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: theme.spacing.md,
      overflow: 'hidden' as const,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
    }),
    [colors],
  );

  const inner = (
    <View style={[cardStyle, style]}>
      {accent ? <View style={{ height: 3, backgroundColor: colors.blue }} /> : null}
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => (pressed ? { opacity: 0.94 } : undefined)}>
        {inner}
      </Pressable>
    );
  }

  return inner;
}

export function PrimaryBanner({
  title,
  subtitle,
  ctaLabel,
  onPress,
}: {
  title: string;
  subtitle: string;
  ctaLabel: string;
  onPress: () => void;
}) {
  const { colors, isDark } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: `${colors.blue}44`,
        backgroundColor: isDark ? `${colors.blue}18` : `${colors.blue}10`,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
      }}
    >
      <Text style={{ fontSize: 15, color: colors.heading, ...fontStyle('bold') }}>{title}</Text>
      <Text style={{ marginTop: 4, fontSize: 13, color: colors.muted, lineHeight: 19, ...fontStyle('regular') }}>
        {subtitle}
      </Text>
      <Text style={{ marginTop: 10, fontSize: 13, color: colors.blue, ...fontStyle('bold') }}>{ctaLabel} →</Text>
    </Pressable>
  );
}
