import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export function NetworkStatCard({
  icon,
  label,
  value,
  active = false,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number | string;
  active?: boolean;
  onPress?: () => void;
}) {
  const { colors, isDark } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: active ? `${colors.blue}14` : colors.surfaceElevated,
          borderColor: active ? colors.blue : colors.border,
          opacity: pressed ? 0.92 : 1,
        },
        theme.shadow.soft,
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: isDark ? colors.surface : `${colors.blue}12` }]}>
        <Ionicons name={icon} size={18} color={colors.blue} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.label, { color: colors.muted }, fontStyle('medium')]} numberOfLines={1}>
          {label}
        </Text>
        <Text style={[styles.value, { color: colors.heading }, fontStyle('bold')]} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 64,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    lineHeight: 13,
    marginBottom: 2,
  },
  value: {
    fontSize: 17,
    lineHeight: 20,
  },
});
