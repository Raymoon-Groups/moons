import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export function SuggestionsList<T>({
  visible,
  loading,
  items,
  onSelect,
  renderItem,
  emptyMessage = 'No suggestions',
}: {
  visible: boolean;
  loading: boolean;
  items: T[];
  onSelect: (item: T) => void;
  renderItem: (item: T) => { title: string; subtitle?: string; icon: keyof typeof Ionicons.glyphMap };
  emptyMessage?: string;
}) {
  const { colors } = useTheme();

  if (!visible) return null;

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: colors.surfaceElevated,
          borderColor: colors.border,
        },
      ]}
    >
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={colors.blue} />
        </View>
      ) : items.length === 0 ? (
        <Text style={[styles.empty, { color: colors.muted }]}>{emptyMessage}</Text>
      ) : (
        items.map((item, index) => {
          const row = renderItem(item);
          return (
            <Pressable
              key={`${row.title}-${index}`}
              onPressIn={() => onSelect(item)}
              style={({ pressed }) => [
                styles.row,
                { borderBottomColor: colors.border },
                index === items.length - 1 && styles.rowLast,
                pressed && { backgroundColor: colors.surface },
              ]}
            >
              <View style={[styles.iconWrap, { backgroundColor: `${colors.blue}14` }]}>
                <Ionicons name={row.icon} size={16} color={colors.blue} />
              </View>
              <View style={styles.textWrap}>
                <Text style={[styles.title, { color: colors.heading }]} numberOfLines={1}>
                  {row.title}
                </Text>
                {row.subtitle ? (
                  <Text style={[styles.subtitle, { color: colors.muted }]} numberOfLines={1}>
                    {row.subtitle}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: theme.radius.md,
    marginTop: -4,
    marginBottom: 10,
    overflow: 'hidden',
    maxHeight: 220,
  },
  loading: { padding: 16, alignItems: 'center' },
  empty: { padding: 14, fontSize: 13, ...fontStyle('regular') },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLast: { borderBottomWidth: 0 },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1, minWidth: 0 },
  title: { fontSize: 14, ...fontStyle('semibold') },
  subtitle: { marginTop: 2, fontSize: 12, ...fontStyle('regular') },
});
