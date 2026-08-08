import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';

export type ConnectionRequestTab = 'pending' | 'requests';

export function ConnectionRequestTabs({
  value,
  onChange,
  pendingCount,
  requestsCount,
}: {
  value: ConnectionRequestTab;
  onChange: (tab: ConnectionRequestTab) => void;
  pendingCount?: number;
  requestsCount?: number;
}) {
  const { colors } = useTheme();

  const tabs: { id: ConnectionRequestTab; label: string; count?: number }[] = [
    { id: 'pending', label: 'Pending', count: pendingCount },
    { id: 'requests', label: 'Requests', count: requestsCount },
  ];

  return (
    <View style={styles.wrap}>
      {tabs.map((tab) => {
        const active = value === tab.id;
        return (
          <Pressable key={tab.id} onPress={() => onChange(tab.id)} style={styles.tab}>
            <View style={styles.tabInner}>
              <Text
                style={[
                  styles.label,
                  active
                    ? { color: colors.heading, ...fontStyle('bold') }
                    : { color: colors.muted, ...fontStyle('semibold') },
                ]}
              >
                {tab.label}
              </Text>
              {typeof tab.count === 'number' && tab.count > 0 ? (
                <Text
                  style={[
                    styles.count,
                    { color: active ? colors.blue : colors.muted },
                    fontStyle('bold'),
                  ]}
                >
                  {tab.count > 99 ? '99+' : tab.count}
                </Text>
              ) : null}
            </View>
            <View
              style={[
                styles.indicator,
                { backgroundColor: active ? colors.blue : 'transparent' },
              ]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  label: {
    fontSize: 16,
  },
  count: {
    fontSize: 12,
  },
  indicator: {
    height: 3,
    width: 64,
    borderRadius: 999,
  },
});
