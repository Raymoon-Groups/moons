import { type ReactNode, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        title: {
          fontSize: 16,
          color: colors.heading,
          marginBottom: theme.spacing.sm,
          ...fontStyle('bold'),
        },
        wrap: { marginBottom: theme.spacing.md },
      }),
    [colors],
  );

  return (
    <View style={styles.wrap}>
      <Card>
        <Text style={styles.title}>{title}</Text>
        {children}
      </Card>
    </View>
  );
}
