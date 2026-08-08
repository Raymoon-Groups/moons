import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { useTheme } from '@/lib/theme-context';

/** Placeholder shown while the first page of the feed loads. */
export function PostSkeleton() {
  const { colors, isDark } = useTheme();
  const pulse = useRef(new Animated.Value(0.4)).current;
  const hairline = isDark ? colors.border : colors.borderSubtle;
  const bone = isDark ? colors.border : colors.borderSubtle;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.9, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const block = (style: object) => (
    <Animated.View style={[{ backgroundColor: bone, opacity: pulse }, style]} />
  );

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginBottom: 14,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: hairline,
        backgroundColor: colors.surfaceElevated,
        paddingTop: 16,
        paddingBottom: 12,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          backgroundColor: colors.blue,
          opacity: 0.5,
        }}
      />
      <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 20 }}>
        {block({ width: 48, height: 48, borderRadius: 16 })}
        <View style={{ flex: 1, gap: 7, justifyContent: 'center' }}>
          {block({ width: '46%', height: 12, borderRadius: 6 })}
          {block({ width: '68%', height: 10, borderRadius: 6 })}
          {block({ width: '24%', height: 9, borderRadius: 6 })}
        </View>
      </View>
      <View style={{ gap: 8, marginTop: 14, paddingHorizontal: 20 }}>
        {block({ width: '100%', height: 11, borderRadius: 5 })}
        {block({ width: '86%', height: 11, borderRadius: 5 })}
      </View>
      {block({
        height: 140,
        marginTop: 14,
        marginHorizontal: 20,
        borderRadius: 14,
      })}
      <View
        style={{
          flexDirection: 'row',
          marginTop: 14,
          marginHorizontal: 12,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: hairline,
          gap: 8,
        }}
      >
        {block({ flex: 1, height: 32, borderRadius: 12 })}
        {block({ flex: 1, height: 32, borderRadius: 12 })}
        {block({ flex: 1, height: 32, borderRadius: 12 })}
      </View>
    </View>
  );
}
