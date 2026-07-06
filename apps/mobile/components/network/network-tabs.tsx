import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export type NetworkTabId = 'suggestions' | 'recent';

const TABS: { id: NetworkTabId; label: string; shortLabel: string }[] = [
  { id: 'suggestions', label: 'People you may know', shortLabel: 'Suggestions' },
  { id: 'recent', label: 'Recently connected', shortLabel: 'Recent' },
];

export function NetworkTabs({
  value,
  onChange,
  compact,
}: {
  value: NetworkTabId;
  onChange: (tab: NetworkTabId) => void;
  compact?: boolean;
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.row, { backgroundColor: `${colors.muted}18`, borderColor: colors.border }]}>
      {TABS.map((tab) => {
        const active = value === tab.id;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            style={[
              styles.tab,
              active
                ? { backgroundColor: colors.blue, ...theme.shadow.soft }
                : { backgroundColor: 'transparent' },
            ]}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
              style={[
                styles.label,
                { color: active ? '#fff' : colors.muted },
                active ? fontStyle('bold') : fontStyle('semibold'),
              ]}
            >
              {compact ? tab.shortLabel : tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 4,
    marginBottom: theme.spacing.md,
    gap: 4,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 999,
  },
  label: { fontSize: 13, textAlign: 'center' },
});
