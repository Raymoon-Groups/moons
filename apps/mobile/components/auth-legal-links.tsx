import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

const LINKS = [
  { label: 'Terms', route: '/terms' },
  { label: 'Privacy', route: '/privacy' },
  { label: 'Contact', route: '/contact' },
] as const;

export function AuthLegalLinks() {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      {LINKS.map((link, index) => (
        <View key={link.route} style={styles.item}>
          {index > 0 ? <Text style={[styles.dot, { color: colors.muted }]}>·</Text> : null}
          <Pressable onPress={() => router.push(link.route as never)} hitSlop={8}>
            <Text style={[{ color: colors.muted, fontSize: 12 }, fontStyle('medium')]}>{link.label}</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    gap: 4,
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { fontSize: 12 },
});
