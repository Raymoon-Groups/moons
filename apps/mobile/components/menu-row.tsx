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
        <Text
          numberOfLines={1}
          style={[styles.label, { color: danger ? colors.error : colors.heading }, fontStyle('bold')]}
        >
          {label}
        </Text>
        {subtitle ? (
          <Text
            numberOfLines={2}
            style={[styles.subtitle, { color: colors.muted }, fontStyle('regular')]}
          >
            {subtitle}
          </Text>
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
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        style={[styles.statValue, { color: accent ?? colors.heading }, fontStyle('extrabold')]}
      >
        {value}
      </Text>
      <Text
        numberOfLines={2}
        style={[styles.statLabel, { color: colors.muted }, fontStyle('semibold')]}
      >
        {label}
      </Text>
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
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={[styles.quickTitle, { color: colors.heading }, fontStyle('bold')]}>
          {title}
        </Text>
        <Text numberOfLines={2} style={[styles.quickSubtitle, { color: colors.muted }, fontStyle('regular')]}>
          {subtitle}
        </Text>
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
          gap: 14,
          borderRadius: theme.radius.xl,
          borderWidth: 1,
          padding: 15,
          marginBottom: 10,
          ...theme.shadow.soft,
        },
        pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
        iconWrap: {
          width: 44,
          height: 44,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
        },
        textWrap: { flex: 1, minWidth: 0 },
        label: { fontSize: 15 },
        subtitle: { marginTop: 3, fontSize: 12, lineHeight: 17 },
        stat: {
          flex: 1,
          minWidth: 0,
          borderRadius: theme.radius.xl,
          borderWidth: 1,
          paddingVertical: 16,
          paddingHorizontal: 8,
          alignItems: 'center',
          ...theme.shadow.soft,
        },
        statValue: { fontSize: 24 },
        statLabel: {
          marginTop: 5,
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: 0.4,
          textAlign: 'center',
        },
        quick: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          borderRadius: theme.radius.xl,
          borderWidth: 1,
          padding: 15,
          marginBottom: 10,
          ...theme.shadow.soft,
        },
        quickIcon: {
          width: 46,
          height: 46,
          borderRadius: 15,
          alignItems: 'center',
          justifyContent: 'center',
        },
        quickTitle: { fontSize: 15 },
        quickSubtitle: { marginTop: 3, fontSize: 12, lineHeight: 17 },
      }),
    [colors],
  );
}
