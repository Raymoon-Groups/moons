import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

/** @deprecated Prefer AppScreen for new screens */
export function ScreenBackground({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }, style]}>
      <LinearGradient
        colors={
          isDark
            ? ['rgba(74, 127, 212, 0.14)', 'transparent', 'rgba(26, 39, 68, 0.35)']
            : ['rgba(74, 127, 212, 0.08)', 'transparent', 'rgba(238, 242, 247, 0.6)']
        }
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.45 }}
        pointerEvents="none"
      />
      <View style={{ flex: 1, paddingTop: insets.top > 0 ? 0 : theme.spacing.sm }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
