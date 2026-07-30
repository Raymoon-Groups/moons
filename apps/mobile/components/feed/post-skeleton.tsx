import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

/** Placeholder card shown while the first page of the feed loads. */
export function PostSkeleton() {
  const { colors } = useTheme();
  const pulse = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const block = (style: object) => (
    <Animated.View style={[{ backgroundColor: colors.border, opacity: pulse }, style]} />
  );

  return (
    <View
      style={{
        backgroundColor: colors.surfaceElevated,
        borderRadius: theme.radius.xl,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 16,
        marginBottom: 14,
      }}
    >
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        {block({ width: 46, height: 46, borderRadius: 23 })}
        <View style={{ flex: 1, gap: 7 }}>
          {block({ width: '55%', height: 12, borderRadius: 6 })}
          {block({ width: '35%', height: 10, borderRadius: 5 })}
        </View>
      </View>
      <View style={{ gap: 8, marginTop: 16 }}>
        {block({ width: '100%', height: 11, borderRadius: 6 })}
        {block({ width: '88%', height: 11, borderRadius: 6 })}
        {block({ width: '60%', height: 11, borderRadius: 6 })}
      </View>
      {block({ width: '100%', height: 150, borderRadius: theme.radius.md, marginTop: 14 })}
      <View
        style={{
          flexDirection: 'row',
          gap: 10,
          marginTop: 16,
          paddingTop: 12,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
        }}
      >
        {block({ flex: 1, height: 14, borderRadius: 7 })}
        {block({ flex: 1, height: 14, borderRadius: 7 })}
        {block({ flex: 1, height: 14, borderRadius: 7 })}
      </View>
    </View>
  );
}
