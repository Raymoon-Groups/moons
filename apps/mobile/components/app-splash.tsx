import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Animated, Easing, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MoonsLogo } from '@/components/moons-logo';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export function AppSplash() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 7,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, scale]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
        glow: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '55%',
        },
        content: {
          alignItems: 'center',
          gap: theme.spacing.lg,
        },
      }),
    [colors, insets.bottom, insets.top],
  );

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={
          isDark
            ? ['rgba(74, 127, 212, 0.28)', 'rgba(26, 39, 68, 0.12)', 'transparent']
            : ['rgba(186, 210, 245, 0.6)', 'rgba(74, 127, 212, 0.1)', 'transparent']
        }
        style={styles.glow}
        pointerEvents="none"
      />
      <Animated.View style={[styles.content, { opacity: fade, transform: [{ scale }] }]}>
        <MoonsLogo size="xl" variant="onDark" />
        <ActivityIndicator size="large" color={colors.blue} />
      </Animated.View>
    </View>
  );
}
