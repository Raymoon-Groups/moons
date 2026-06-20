import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme } from '@/lib/theme-context';

/** Full-height screen shell for tab content and lists */
export function AppScreen({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }, style]}>
      <LinearGradient
        colors={
          isDark
            ? ['rgba(74, 127, 212, 0.14)', 'rgba(26, 39, 68, 0.08)', 'transparent']
            : ['rgba(186, 210, 245, 0.45)', 'rgba(74, 127, 212, 0.06)', 'transparent']
        }
        locations={[0, 0.45, 1]}
        style={styles.topGlow}
        pointerEvents="none"
      />
      <LinearGradient
        colors={
          isDark
            ? ['transparent', 'rgba(26, 39, 68, 0.2)']
            : ['transparent', 'rgba(186, 210, 245, 0.15)']
        }
        style={styles.bottomGlow}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
  },
  bottomGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
});
