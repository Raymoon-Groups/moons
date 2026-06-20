import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search jobs, companies…',
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          backgroundColor: colors.surfaceElevated,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: theme.radius.lg,
          paddingHorizontal: 16,
          paddingVertical: 14,
          marginBottom: theme.spacing.sm,
          ...theme.shadow.soft,
        },
        input: {
          flex: 1,
          fontSize: 15,
          ...fontStyle('regular'),
          color: colors.foreground,
          padding: 0,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.wrap}>
      <Ionicons name="search" size={20} color={colors.blue} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
    </View>
  );
}
