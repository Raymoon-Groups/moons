import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export type NetworkTabId = 'connections' | 'pending' | 'sent' | 'suggestions' | 'recent';

const PRIMARY_TABS: { id: NetworkTabId; label: string }[] = [
  { id: 'connections', label: 'Connections' },
  { id: 'pending', label: 'Pending' },
  { id: 'sent', label: 'Sent' },
];

const DISCOVER_TABS: { id: NetworkTabId; label: string }[] = [
  { id: 'suggestions', label: 'Suggestions' },
  { id: 'recent', label: 'Recent' },
];

function InstagramTab({
  label,
  active,
  count,
  onPress,
}: {
  label: string;
  active: boolean;
  count?: number;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable onPress={onPress} style={styles.tab}>
      <View style={styles.tabInner}>
        <Text
          numberOfLines={1}
          style={[
            styles.tabLabel,
            active
              ? { color: colors.heading, ...fontStyle('bold') }
              : { color: colors.muted, ...fontStyle('semibold') },
          ]}
        >
          {label}
        </Text>
        {typeof count === 'number' && count > 0 ? (
          <View style={[styles.countBadge, { backgroundColor: active ? colors.blue : `${colors.muted}33` }]}>
            <Text
              style={[
                styles.countText,
                { color: active ? '#fff' : colors.muted },
                fontStyle('bold'),
              ]}
            >
              {count > 99 ? '99+' : count}
            </Text>
          </View>
        ) : null}
      </View>
      <View
        style={[
          styles.indicator,
          active ? { backgroundColor: colors.heading } : { backgroundColor: 'transparent' },
        ]}
      />
    </Pressable>
  );
}

export function NetworkTabs({
  value,
  onChange,
  counts,
}: {
  value: NetworkTabId;
  onChange: (tab: NetworkTabId) => void;
  counts?: Partial<Record<'connections' | 'pending' | 'sent', number>>;
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.wrap, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}>
      <View style={styles.primaryRow}>
        {PRIMARY_TABS.map((tab) => (
          <InstagramTab
            key={tab.id}
            label={tab.label}
            active={value === tab.id}
            count={
              tab.id === 'connections'
                ? counts?.connections
                : tab.id === 'pending'
                  ? counts?.pending
                  : tab.id === 'sent'
                    ? counts?.sent
                    : undefined
            }
            onPress={() => onChange(tab.id)}
          />
        ))}
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.discoverRow}>
        {DISCOVER_TABS.map((tab) => {
          const active = value === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => onChange(tab.id)}
              style={[
                styles.discoverTab,
                active
                  ? { backgroundColor: `${colors.blue}14`, borderColor: `${colors.blue}44` }
                  : { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text
                style={[
                  styles.discoverLabel,
                  active
                    ? { color: colors.blue, ...fontStyle('bold') }
                    : { color: colors.muted, ...fontStyle('semibold') },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    ...theme.shadow.soft,
  },
  primaryRow: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 14,
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  tabLabel: {
    fontSize: 13,
    letterSpacing: 0.1,
  },
  countBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { fontSize: 10, lineHeight: 12 },
  indicator: {
    marginTop: 12,
    height: 2,
    width: '72%',
    borderRadius: 999,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: theme.spacing.md,
  },
  discoverRow: {
    flexDirection: 'row',
    gap: 8,
    padding: theme.spacing.sm,
  },
  discoverTab: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  discoverLabel: { fontSize: 12 },
});
