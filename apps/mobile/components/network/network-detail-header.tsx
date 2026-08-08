import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export function NetworkDetailHeader({
  title,
  subtitle,
  count,
  icon,
  onBack,
}: {
  title: string;
  subtitle: string;
  count?: number;
  icon: keyof typeof Ionicons.glyphMap;
  onBack: () => void;
}) {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.wrap}>
      <Pressable onPress={onBack} style={styles.topRow} hitSlop={8} accessibilityLabel="Back">
        <View
          style={[
            styles.backBtn,
            { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
            theme.shadow.soft,
          ]}
        >
          <Ionicons name="chevron-back" size={18} color={colors.heading} />
        </View>
        <Text style={[styles.navTitle, { color: colors.heading }, fontStyle('bold')]} numberOfLines={1}>
          {title}
        </Text>
      </Pressable>

      <View
        style={[
          styles.hero,
          {
            backgroundColor: colors.surfaceElevated,
            borderColor: colors.border,
          },
          theme.shadow.soft,
        ]}
      >
        <View style={[styles.heroIcon, { backgroundColor: isDark ? colors.surface : `${colors.blue}14` }]}>
          <Ionicons name={icon} size={22} color={colors.blue} />
        </View>
        <View style={styles.heroCopy}>
          <View style={styles.heroTitleRow}>
            <Text style={[styles.heroTitle, { color: colors.heading }, fontStyle('bold')]} numberOfLines={1}>
              {title}
            </Text>
            {typeof count === 'number' ? (
              <View style={[styles.countPill, { backgroundColor: `${colors.blue}14` }]}>
                <Text style={[{ color: colors.blue, fontSize: 12 }, fontStyle('bold')]}>{count}</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.heroSubtitle, { color: colors.muted }]} numberOfLines={2}>
            {subtitle}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function NetworkSegmentTabs({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string; count?: number }[];
  value: string;
  onChange: (id: string) => void;
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.segments, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <Pressable
            key={opt.id}
            onPress={() => onChange(opt.id)}
            style={[
              styles.segment,
              active && { backgroundColor: colors.surfaceElevated, ...theme.shadow.soft },
            ]}
          >
            <Text
              style={[
                styles.segmentLabel,
                { color: active ? colors.heading : colors.muted },
                active ? fontStyle('bold') : fontStyle('semibold'),
              ]}
              numberOfLines={1}
            >
              {opt.label}
              {typeof opt.count === 'number' ? ` · ${opt.count}` : ''}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    flex: 1,
    fontSize: 18,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 14,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroTitle: {
    fontSize: 16,
    flexShrink: 1,
  },
  countPill: {
    minWidth: 26,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSubtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
  },
  segments: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 14,
  },
  segment: {
    flex: 1,
    minHeight: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  segmentLabel: {
    fontSize: 13,
  },
});
