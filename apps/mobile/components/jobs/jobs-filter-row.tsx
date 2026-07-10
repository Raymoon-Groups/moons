import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export function JobsFilterRow({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: string; icon?: keyof typeof Ionicons.glyphMap }[];
  value: string;
  onChange: (value: string) => void;
}) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        scroll: { marginBottom: theme.spacing.sm },
        row: { flexDirection: 'row', gap: 8, paddingRight: 4 },
        chip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          borderRadius: theme.radius.full,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 14,
          paddingVertical: 9,
          backgroundColor: colors.surface,
        },
        chipActive: {
          borderColor: colors.blue,
          backgroundColor: isDark ? `${colors.blue}22` : `${colors.blue}12`,
        },
        text: { fontSize: 13, color: colors.muted, ...fontStyle('semibold') },
        textActive: { color: colors.blue },
      }),
    [colors, isDark],
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.chip, active && styles.chipActive]}
          >
            {opt.icon ? (
              <Ionicons name={opt.icon} size={15} color={active ? colors.blue : colors.muted} />
            ) : null}
            <Text style={[styles.text, active && styles.textActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
