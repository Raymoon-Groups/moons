import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export function MenuRow({
  icon,
  label,
  subtitle,
  onPress,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useRowStyles();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: danger ? colors.errorBg : `${colors.blue}14` }]}>
        <Ionicons name={icon} size={20} color={danger ? colors.error : colors.blue} />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.label, { color: danger ? colors.error : colors.heading }, fontStyle('bold')]}>
          {label}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.muted }, fontStyle('regular')]}>{subtitle}</Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

export function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  const { colors } = useTheme();
  const styles = useRowStyles();

  return (
    <View style={[styles.stat, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
      <Text style={[styles.statValue, { color: accent ?? colors.heading }, fontStyle('extrabold')]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.muted }, fontStyle('semibold')]}>{label}</Text>
    </View>
  );
}

export function QuickLinkCard({
  title,
  subtitle,
  icon,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useRowStyles();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quick,
        { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.quickIcon, { backgroundColor: `${colors.blue}12` }]}>
        <Ionicons name={icon} size={22} color={colors.blue} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.quickTitle, { color: colors.heading }, fontStyle('bold')]}>{title}</Text>
        <Text style={[styles.quickSubtitle, { color: colors.muted }, fontStyle('regular')]}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

function useRowStyles() {
  const { colors } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          padding: 14,
          marginBottom: 10,
          ...theme.shadow.soft,
        },
        pressed: { opacity: 0.92 },
        iconWrap: {
          width: 42,
          height: 42,
          borderRadius: 13,
          alignItems: 'center',
          justifyContent: 'center',
        },
        textWrap: { flex: 1 },
        label: { fontSize: 15 },
        subtitle: { marginTop: 2, fontSize: 12 },
        stat: {
          flex: 1,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          padding: 14,
          alignItems: 'center',
          ...theme.shadow.soft,
        },
        statValue: { fontSize: 22 },
        statLabel: { marginTop: 4, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4 },
        quick: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          padding: 14,
          marginBottom: 10,
          ...theme.shadow.soft,
        },
        quickIcon: {
          width: 44,
          height: 44,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
        },
        quickTitle: { fontSize: 15 },
        quickSubtitle: { marginTop: 2, fontSize: 12 },
      }),
    [colors],
  );
}
