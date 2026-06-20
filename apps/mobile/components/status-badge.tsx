import { ApplicationStatus } from '@moons/shared';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatApplicationStatus } from '@/lib/format';
import { useTheme } from '@/lib/theme-context';
import type { ThemeColors } from '@/lib/theme-palettes';
import { theme } from '@/lib/theme';

function statusStyles(colors: ThemeColors) {
  return {
    [ApplicationStatus.SUBMITTED]: {
      bg: colors.warningBg,
      text: colors.warning,
      border: 'rgba(252, 211, 77, 0.35)',
    },
    [ApplicationStatus.VIEWED]: {
      bg: colors.infoBg,
      text: colors.info,
      border: 'rgba(125, 211, 252, 0.35)',
    },
    [ApplicationStatus.SHORTLISTED]: {
      bg: colors.successBg,
      text: colors.success,
      border: 'rgba(134, 239, 172, 0.35)',
    },
    [ApplicationStatus.REJECTED]: {
      bg: colors.errorBg,
      text: colors.error,
      border: 'rgba(248, 113, 113, 0.35)',
    },
  };
}

export function StatusBadge({ status }: { status: string }) {
  const { colors } = useTheme();
  const map = statusStyles(colors);
  const palette = map[status as ApplicationStatus] ?? {
    bg: colors.surface,
    text: colors.muted,
    border: colors.border,
  };

  return (
    <View style={[badgeStyles.badge, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      <Text style={[badgeStyles.text, { color: palette.text }]}>{formatApplicationStatus(status)}</Text>
    </View>
  );
}

export function Chip({ label }: { label: string }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        chip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          alignSelf: 'flex-start',
          borderRadius: theme.radius.full,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 10,
          paddingVertical: 5,
          marginTop: theme.spacing.sm,
        },
        dot: {
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: colors.blue,
        },
        chipText: {
          fontSize: 12,
          color: colors.silver,
          fontFamily: theme.fonts.semibold,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.chip}>
      <View style={styles.dot} />
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: theme.radius.full,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  text: { fontSize: 11, fontFamily: theme.fonts.bold },
});
